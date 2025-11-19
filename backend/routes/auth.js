const express = require("express");
const router = express.Router();

// Controllers
const {
  signup,
  loginUser,
  getFood,
  addFood,
  addBulk,
  updateFood,
  deleteFood,
  order,
  getOrder,
  deleteOrder,
  createOrder,
  verifyPayment,
  getPayments,
  review,
  addFavorites,
  adminAnalytics,
} = require("../controller/authController");

// Middlewares
const authMiddleware = require("../middleware/AuthMiddleware");
const isAdmin = require("../middleware/AdminMiddleware");

// =========================
// Auth Routes
// =========================
router.post("/signup", signup);
router.post("/login", loginUser);

// =========================
// Public Routes
// =========================
router.get("/food", getFood);

// =========================
// User-Protected Routes
// =========================
router.post("/orders", authMiddleware, order);
router.get("/orders/:userId", authMiddleware, getOrder);
router.delete("/orders/:orderId", authMiddleware, deleteOrder);

// Razorpay Payment Routes
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.get("/payment/:paymentId", getPayments);

// Reviews & Favorites
router.post("/:id/review", authMiddleware, review);
router.post("/:id/favorite", authMiddleware, addFavorites);

// =========================
// Admin Routes
// =========================
router.post("/addFood", authMiddleware, isAdmin, addFood);
router.post("/addBulk", authMiddleware, isAdmin, addBulk);
router.put("/updateFood/:id", authMiddleware, isAdmin, updateFood);
router.delete("/deleteFood/:id", authMiddleware, isAdmin, deleteFood);
router.get("/adminAnalytics", authMiddleware, isAdmin, adminAnalytics);

router.get("/admin/dashboard", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Welcome to the admin dashboard!" });
});

module.exports = router;
