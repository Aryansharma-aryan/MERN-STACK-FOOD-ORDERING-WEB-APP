const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/OrderModel");
const Food = require("../models/FoodData");

function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function coordinates(value) {
  return value && Number.isFinite(value.lat) && Math.abs(value.lat) <= 90 && Number.isFinite(value.lng) && Math.abs(value.lng) <= 180;
}
const transitions = {
  "Awaiting Payment": [], Pending: ["Preparing", "Cancelled"],
  Preparing: ["Out for Delivery"], "Out for Delivery": ["Delivered"], Delivered: [], Cancelled: [],
};
function createCommerce({ OrderModel = Order, FoodModel = Food, gateway, secret = process.env.RAZORPAY_KEY_SECRET } = {}) {
  const paymentGateway = () => {
    if (gateway) return gateway;
    if (!process.env.RAZORPAY_KEY_ID || !secret) fail(503, "Online payment is unavailable. Please choose cash on delivery.");
    gateway = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: secret });
    return gateway;
  };
  const wrap = handler => async (req, res) => {
    try { await handler(req, res); } catch (error) {
      const status = error.status || (error.name === "ValidationError" || error.name === "CastError" ? 400 : 500);
      res.status(status).json({ message: status === 500 ? "Unable to complete the request. Please try again." : error.message });
    }
  };
  async function owned(req, id) {
    if (!mongoose.isValidObjectId(id)) fail(400, "Invalid order ID.");
    const order = await OrderModel.findOne({ _id: id, ...(req.user.role === "admin" ? {} : { userId: req.user.id }) });
    if (!order) fail(404, "Order not found.");
    return order;
  }
  async function savePaid(order, payment) {
    if (payment.order_id !== order.razorpayOrderId || payment.amount !== Math.round(order.totalAmount * 100) || payment.currency !== "INR") fail(400, "Payment does not match this order.");
    if (payment.status !== "captured") fail(409, "Payment is not captured yet. Refresh payment status shortly; do not pay again.");
    const paidAt = new Date(payment.created_at * 1000);
    await OrderModel.updateOne({ _id: order._id, paymentStatus: { $ne: "paid" } }, {
      $set: { paymentStatus: "paid", paymentId: payment.id, paidAt, status: "Pending" },
      $push: { statusHistory: { status: "Pending", timestamp: new Date() } },
    });
    return OrderModel.findById(order._id);
  }
  return {
    order: wrap(async (req, res) => {
      const { items, deliveryAddress, phone, customerLocation, paymentMethod = "cod", requestId } = req.body;
      if (!Array.isArray(items) || !items.length || items.length > 100) fail(400, "Add between 1 and 100 products.");
      if (typeof requestId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(requestId)) fail(400, "A valid checkout reference is required.");
      const previous = await OrderModel.findOne({ userId: req.user.id, requestId });
      if (previous) return res.json({ order: previous });
      if (typeof deliveryAddress !== "string" || deliveryAddress.trim().length < 10 || deliveryAddress.length > 500) fail(400, "Enter a complete delivery address.");
      if (typeof phone !== "string" || !/^\+?[\d\s()-]{10,20}$/.test(phone)) fail(400, "Enter a valid contact phone number.");
      if (!["cod", "online"].includes(paymentMethod)) fail(400, "Invalid payment method.");
      if (customerLocation && !coordinates(customerLocation)) fail(400, "Invalid delivery coordinates.");
      const quantities = new Map();
      for (const item of items) {
        if (!mongoose.isValidObjectId(item._id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) fail(400, "Invalid product or quantity.");
        quantities.set(item._id, (quantities.get(item._id) || 0) + item.quantity);
        if (quantities.get(item._id) > 99) fail(400, "Maximum quantity is 99 per product.");
      }
      const foods = await FoodModel.find({ _id: { $in: [...quantities.keys()] } });
      if (foods.length !== quantities.size) fail(400, "A product is no longer available. Update your cart.");
      const snapshots = foods.map(food => ({ foodId: food._id, name: food.name, price: food.price, image: food.image, quantity: quantities.get(String(food._id)) }));
      if (snapshots.some(item => !Number.isFinite(item.price) || item.price < 0)) fail(400, "A product has an invalid price.");
      const subtotalPaise = snapshots.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
      const taxPaise = Math.round(subtotalPaise * 0.05);
      const status = paymentMethod === "online" ? "Awaiting Payment" : "Pending";
      const data = { userId: req.user.id, requestId, items: snapshots, subtotal: subtotalPaise / 100, tax: taxPaise / 100,
        totalAmount: (subtotalPaise + taxPaise) / 100, deliveryAddress: deliveryAddress.trim(), phone: phone.trim(),
        customerLocation: customerLocation || null, paymentMethod, status, statusHistory: [{ status }] };
      let order;
      try { order = await OrderModel.create(data); }
      catch (error) { if (error.code !== 11000) throw error; order = await OrderModel.findOne({ userId: req.user.id, requestId }); }
      res.status(201).json({ order });
    }),
    getOrder: wrap(async (req, res) => {
      if (String(req.user.id) !== req.params.userId && req.user.role !== "admin") fail(403, "Access denied.");
      res.json(await OrderModel.find({ userId: req.params.userId }).sort({ createdAt: -1 }));
    }),
    detail: wrap(async (req, res) => res.json({ order: await owned(req, req.params.orderId) })),
    adminOrders: wrap(async (_req, res) => res.json(await OrderModel.find().sort({ createdAt: -1 }).limit(200))),
    updateStatus: wrap(async (req, res) => {
      const order = await owned(req, req.params.orderId);
      const { status } = req.body;
      if (!transitions[order.status]?.includes(status)) fail(400, "This status change is not allowed.");
      if (status === "Cancelled" && order.paymentStatus === "paid") fail(400, "Paid orders require a refund through support before cancellation.");
      const changes = { status };
      if (status === "Delivered" && order.paymentMethod === "cod") { changes.paymentStatus = "paid"; changes.paidAt = new Date(); }
      const updated = await OrderModel.findOneAndUpdate({ _id: order._id, status: order.status }, { $set: changes, $push: { statusHistory: { status, timestamp: new Date() } } }, { new: true });
      if (!updated) fail(409, "The order changed. Refresh and try again.");
      res.json({ order: updated });
    }),
    location: wrap(async (req, res) => {
      const order = await owned(req, req.params.orderId);
      if (order.status !== "Out for Delivery") fail(400, "Location can be updated only during delivery.");
      if (!coordinates(req.body)) fail(400, "Invalid driver coordinates.");
      order.deliveryPersonLocation = { lat: req.body.lat, lng: req.body.lng };
      order.locationUpdatedAt = new Date();
      await order.save();
      res.json({ order });
    }),
    deleteOrder: wrap(async (req, res) => {
      const order = await owned(req, req.params.orderId);
      if (!["Pending", "Awaiting Payment"].includes(order.status) || order.paymentStatus === "paid" || order.razorpayOrderId) fail(400, "This order cannot be cancelled. Contact support.");
      const updated = await OrderModel.findOneAndUpdate({ _id: order._id, status: order.status, paymentStatus: { $ne: "paid" }, razorpayOrderId: { $exists: false } }, { $set: { status: "Cancelled" }, $push: { statusHistory: { status: "Cancelled", timestamp: new Date() } } }, { new: true });
      if (!updated) fail(409, "The order changed. Refresh and try again.");
      res.json({ order: updated });
    }),
    createOrder: wrap(async (req, res) => {
      const order = await owned(req, req.body.orderId);
      if (order.paymentMethod !== "online" || order.status !== "Awaiting Payment") fail(400, "This order does not need online payment.");
      const api = paymentGateway();
      let paymentOrder;
      if (order.razorpayOrderId) paymentOrder = await api.orders.fetch(order.razorpayOrderId);
      else {
        paymentOrder = await api.orders.create({ amount: Math.round(order.totalAmount * 100), currency: "INR", receipt: String(order._id) });
        const updated = await OrderModel.findOneAndUpdate({ _id: order._id, status: "Awaiting Payment", razorpayOrderId: { $exists: false } }, { $set: { razorpayOrderId: paymentOrder.id } }, { new: true });
        if (!updated) {
          const latest = await OrderModel.findById(order._id);
          if (!latest || latest.status !== "Awaiting Payment" || !latest.razorpayOrderId) fail(409, "Order changed. Refresh before making a payment.");
          paymentOrder = await api.orders.fetch(latest.razorpayOrderId);
        }
      }
      res.json({ order: paymentOrder, keyId: process.env.RAZORPAY_KEY_ID });
    }),
    verifyPayment: wrap(async (req, res) => {
      const order = await owned(req, req.body.orderId);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!order.razorpayOrderId || razorpay_order_id !== order.razorpayOrderId || typeof razorpay_payment_id !== "string" || typeof razorpay_signature !== "string" || !/^[a-f0-9]{64}$/.test(razorpay_signature)) fail(400, "Invalid payment verification details.");
      const api = paymentGateway();
      const expected = crypto.createHmac("sha256", secret).update(`${order.razorpayOrderId}|${razorpay_payment_id}`).digest();
      if (!crypto.timingSafeEqual(expected, Buffer.from(razorpay_signature, "hex"))) fail(400, "Invalid payment signature.");
      const payment = await api.payments.fetch(razorpay_payment_id);
      res.json({ success: true, order: await savePaid(order, payment) });
    }),
    reconcile: wrap(async (req, res) => {
      const order = await owned(req, req.params.orderId);
      if (order.paymentStatus === "paid") return res.json({ order });
      if (!order.razorpayOrderId) fail(400, "No online payment has been started.");
      const result = await paymentGateway().orders.fetchPayments(order.razorpayOrderId);
      const captured = result.items.find(payment => payment.status === "captured");
      if (!captured) fail(409, "Payment has not completed. You can retry payment if no charge was made.");
      res.json({ order: await savePaid(order, captured) });
    }),
    getPayments: wrap(async (req, res) => {
      const order = await OrderModel.findOne({ paymentId: req.params.paymentId, userId: req.user.id });
      if (!order) fail(404, "Receipt not found.");
      res.json({ order });
    }),
  };
}
module.exports = { ...createCommerce(), createCommerce, coordinates, transitions };
