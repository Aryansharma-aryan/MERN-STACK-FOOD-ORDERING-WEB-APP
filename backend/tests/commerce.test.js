const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Order = require("../models/OrderModel");
const { createCommerce, coordinates } = require("../controller/commerceController");
const userId = "507f1f77bcf86cd799439011";
const foodId = "507f191e810c19729de860ea";
const secret = "test-only-payment-secret";
function fixture() {
  const records = new Map();
  let gatewayCalls = 0;
  const matches = (record, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === "object" && "$ne" in value) return record[key] !== value.$ne;
    if (value && typeof value === "object" && "$exists" in value) return (record[key] !== undefined) === value.$exists;
    return String(record[key]) === String(value);
  });
  const model = {
    async findOne(query) { return [...records.values()].find(record => matches(record, query)) || null; },
    async findById(id) { return records.get(String(id)); },
    async create(data) {
      const doc = new Order(data); await doc.validate();
      const record = doc.toObject();
      record.save = async () => record;
      records.set(String(record._id), record);
      return record;
    },
    async findOneAndUpdate(query, update) {
      const record = await this.findOne(query);
      if (!record) return null;
      Object.assign(record, update.$set);
      if (update.$push?.statusHistory) record.statusHistory.push(update.$push.statusHistory);
      return record;
    },
    async updateOne(query, update) { return this.findOneAndUpdate(query, update); },
  };
  const payment = { id: "pay_test", order_id: "order_test", amount: 52395, currency: "INR", status: "captured", created_at: 1700000000 };
  const gateway = {
    orders: {
      async create(options) { gatewayCalls++; return { id: "order_test", ...options }; },
      async fetch(id) { return { id, amount: payment.amount, currency: "INR" }; },
      async fetchPayments() { return { items: [payment] }; },
    },
    payments: { async fetch() { return payment; } },
  };
  const controller = createCommerce({ OrderModel: model, FoodModel: { async find() { return [{ _id: foodId, name: "Pizza", price: 249.5, image: "pizza.jpg" }]; } }, gateway, secret });
  const body = { items: [{ _id: foodId, quantity: 2, price: 1 }], totalAmount: 1, userId: "attacker", deliveryAddress: "10 Test Street, Test City 100001", phone: "9876543210", requestId: "checkout-test-1" };
  async function call(name, overrides = {}) {
    const req = { user: { id: userId, role: "user" }, body: { ...body }, params: {}, ...overrides };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    await controller[name](req, res); return res;
  }
  return { call, body, records, payment, gatewayCalls: () => gatewayCalls };
}
test("checkout uses database prices, authenticated owner, valid schema and a single tax calculation", async () => {
  const f = fixture(); const result = await f.call("order");
  assert.equal(result.statusCode, 201);
  const order = result.body.order;
  assert.equal(String(order.userId), userId);
  assert.equal(order.subtotal, 499); assert.equal(order.tax, 24.95); assert.equal(order.totalAmount, 523.95);
  assert.equal(order.status, "Pending"); assert.equal(order.customerLocation, null);
  assert.equal(order.paymentStatus, "pending");
  const retry = await f.call("order"); assert.equal(String(retry.body.order._id), String(order._id)); assert.equal(f.records.size, 1);
});
test("invalid quantities and missing addresses are rejected", async () => {
  const f = fixture();
  for (const quantity of [0, -1, 100, 1.5]) assert.equal((await f.call("order", { body: { ...f.body, items: [{ _id: foodId, quantity }] } })).statusCode, 400);
  assert.equal((await f.call("order", { body: { ...f.body, deliveryAddress: "" } })).statusCode, 400);
  assert.equal(f.records.size, 0);
});
test("customers cannot read, pay for or cancel another customer's order", async () => {
  const f = fixture(); const order = (await f.call("order")).body.order;
  const other = { id: "507f1f77bcf86cd799439022", role: "user" };
  for (const name of ["detail", "deleteOrder", "createOrder"]) assert.equal((await f.call(name, { user: other, params: { orderId: String(order._id) }, body: { orderId: String(order._id) } })).statusCode, 404);
  assert.equal((await f.call("getOrder", { user: other, params: { userId } })).statusCode, 403);
});
test("progress is sequential and driver coordinates preserve zero values", async () => {
  const f = fixture(); const order = (await f.call("order")).body.order; const params = { orderId: String(order._id) };
  assert.equal((await f.call("updateStatus", { params, body: { status: "Delivered" } })).statusCode, 400);
  for (const status of ["Preparing", "Out for Delivery"]) assert.equal((await f.call("updateStatus", { params, body: { status } })).statusCode, 200);
  assert.equal((await f.call("location", { params, body: { lat: 0, lng: 0 } })).statusCode, 200);
  assert.deepEqual(order.deliveryPersonLocation, { lat: 0, lng: 0 });
  assert.equal((await f.call("location", { params, body: { lat: 91, lng: 0 } })).statusCode, 400);
  await f.call("updateStatus", { params, body: { status: "Delivered" } });
  assert.equal(order.paymentStatus, "paid"); assert.equal(order.statusHistory.length, 4);
  assert.equal((await f.call("deleteOrder", { params })).statusCode, 400);
});
test("payment order retries reuse provider order; payment signatures, amounts and capture are verified", async () => {
  const f = fixture(); const order = (await f.call("order", { body: { ...f.body, paymentMethod: "online" } })).body.order;
  const orderId = String(order._id);
  assert.equal(order.status, "Awaiting Payment");
  await f.call("createOrder", { body: { orderId } }); await f.call("createOrder", { body: { orderId } }); assert.equal(f.gatewayCalls(), 1);
  const body = { orderId, razorpay_order_id: "order_test", razorpay_payment_id: "pay_test", razorpay_signature: "0".repeat(64) };
  assert.equal((await f.call("verifyPayment", { body })).statusCode, 400);
  body.razorpay_signature = crypto.createHmac("sha256", secret).update("order_test|pay_test").digest("hex");
  f.payment.amount = 1; assert.equal((await f.call("verifyPayment", { body })).statusCode, 400);
  f.payment.amount = 52395; f.payment.status = "authorized"; assert.equal((await f.call("verifyPayment", { body })).statusCode, 409);
  f.payment.status = "captured"; assert.equal((await f.call("verifyPayment", { body })).statusCode, 200);
  assert.equal(order.paymentStatus, "paid"); assert.equal(order.status, "Pending"); assert.equal(order.paymentId, "pay_test");
  await f.call("verifyPayment", { body }); assert.equal(order.statusHistory.length, 2);
});
test("captured payment can be recovered after browser interruption", async () => {
  const f = fixture(); const order = (await f.call("order", { body: { ...f.body, paymentMethod: "online" } })).body.order;
  const orderId = String(order._id); await f.call("createOrder", { body: { orderId } });
  assert.equal((await f.call("deleteOrder", { params: { orderId } })).statusCode, 400);
  assert.equal((await f.call("reconcile", { params: { orderId } })).statusCode, 200);
  assert.equal(order.paymentStatus, "paid");
});
test("coordinate validation rejects non-finite values", () => {
  assert.equal(coordinates({ lat: 0, lng: 0 }), true);
  assert.equal(coordinates({ lat: NaN, lng: 0 }), false);
  assert.equal(coordinates({ lat: 0, lng: Infinity }), false);
});
test("HTTP routes expose the menu to guests and require authentication for checkout, receipts and admin changes", async () => {
  process.env.JWT_SECRET = "test-only-http-secret";
  const express = require("express");
  const Food = require("../models/FoodData");
  const original = Food.find;
  Food.find = () => ({ lean: async () => [{ _id: foodId, name: "Pizza" }] });
  const app = express(); app.use(express.json()); app.use("/api", require("../routes/auth"));
  const server = await new Promise(resolve => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    assert.equal((await fetch(`${base}/food`)).status, 200);
    for (const [method, path] of [["POST", "/orders"], ["GET", `/order-details/${userId}`], ["GET", "/payment/pay_test"], ["POST", "/create-order"], ["PATCH", `/admin/orders/${userId}/status`]]) {
      assert.equal((await fetch(base + path, { method })).status, 401);
    }
  } finally { Food.find = original; await new Promise(resolve => server.close(resolve)); }
});
