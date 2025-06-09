const mongoose = require("mongoose");
const Food = require("../models/FoodData");
const User = require("../models/User");
const Order = require("../models/OrderModel");
const Payment = require("../models/PaymentModel");

const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "TFYUG67T67T762";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const validateSignup = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Invalid email format"),
  check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  check("email").isEmail().withMessage("Invalid email format"),
  check("password").notEmpty().withMessage("Password is required"),
];

const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = "user" } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    const adminEmail = "arsharma2951@gmail.com";
    if (!(await User.findOne({ email: adminEmail }))) {
      const adminUser = new User({
        name: "Aryan Sharma",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      await adminUser.save();
    }

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000,
    });

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addFood = async (req, res) => {
  try {
    const { name, price, description, image } = req.body;
    const foodItem = new Food({ name, price, description, image });
    await foodItem.save();
    res.status(200).json({ message: "Food item added successfully" });
  } catch (err) {
    console.error("Error adding food item:", err);
    res.status(500).json({ message: "Error adding food item" });
  }
};

const addBulk = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: "Data must be an array" });
    }
    const foodItems = await Food.insertMany(req.body);
    res.status(201).json({ message: "Bulk food added!", food: foodItems });
  } catch (err) {
    console.error("Error adding bulk food:", err);
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

const getFood = async (req, res) => {
  try {
    const foods = await Food.find();
    res.status(200).json(foods);
  } catch (err) {
    console.error("Error fetching food:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const order = async (req, res) => {
  try {
    const { items, totalPrice, userId, customerLocation } = req.body;
    if (!customerLocation?.lat || !customerLocation?.lng) {
      return res.status(400).json({ error: "Customer location is required!" });
    }
    const newOrder = new Order({ items, totalPrice, userId, customerLocation });
    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully!", order: newOrder });
  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    const ordersWithLocation = orders.map((o) => ({
      ...o.toObject(),
      location: o.location || { lat: 28.7041, lng: 77.1025 },
    }));
    res.json(ordersWithLocation);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid orderId" });
    }
    const deleted = await Order.findByIdAndDelete(orderId);
    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order deleted successfully", orderId });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      payment_capture: 1,
    });
    res.json({ success: true, order, paymentId: order.id });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency } = req.body;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid Signature" });
    }

    const payment = new Payment({ order_id: razorpay_order_id, payment_id: razorpay_payment_id, signature: razorpay_signature, amount, currency, status: "success", createdAt: new Date() });
    await payment.save();
    res.json({ success: true, message: "Payment Verified & Saved Successfully", payment });
  } catch (err) {
    console.error("Error Verifying Payment:", err);
    res.status(500).json({ error: err.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ error: "Invalid request. No payment ID found." });
    }
    const payment = await razorpay.payments.fetch(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }
    res.json({
      paymentId: payment.id,
      amount: (payment.amount / 100).toFixed(2),
      status: payment.status,
      paymentDate: new Date(payment.created_at * 1000).toLocaleDateString(),
    });
  } catch (err) {
    console.error("Error fetching payment details:", err);
    res.status(500).json({ error: "Error fetching payment details." });
  }
};

const review = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }
    food.reviews.push({ name, rating, comment });
    await food.save();
    res.status(200).json({ message: "Review added successfully" });
  } catch (err) {
    console.error("Review POST Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const addFavorites = async (req, res) => {
  try {
    const updatedFood = await Food.findByIdAndUpdate(req.params.id, { isFavorite: true }, { new: true });
    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    res.status(200).json({ message: `${updatedFood.name} added to favorites!` });
  } catch (err) {
    console.error("Error updating favorite:", err);
    res.status(500).json({ message: "Failed to update favorite", error: err });
  }
};

const adminAnalytics = async (req, res) => {
  try {
    const dailyOrders = await Order.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    const bestsellers = await Food.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "items.foodId",
          as: "orders",
        },
      },
      { $project: { name: 1, totalSold: { $size: "$orders" } } },
      { $sort: { totalSold: -1 } },
    ]);

    const revenueAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]);

    res.json({
      dailyOrders,
      bestsellers,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Error fetching analytics." });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid food ID" });
    }
    const deleted = await Food.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.json({ message: "Food item deleted successfully" });
  } catch (err) {
    console.error("Error deleting food item:", err);
    res.status(500).json({ error: err.message });
  }
};

const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid food ID" });
    }
    const updated = await Food.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating food:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  validateSignup,
  validateLogin,
  signup,
  login,
  addFood,
  addBulk,
  getFood,
  order,
  getOrder,
  deleteOrder,
  createOrder,
  verifyPayment,
  getPayments,
  review,
  addFavorites,
  adminAnalytics,
  deleteFood,
  updateFood,
};
