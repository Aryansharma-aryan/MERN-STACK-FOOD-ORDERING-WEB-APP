const { signup, loginUser } = require("../controller/accountController");
const express = require("express");
const router = express.Router();
const { order, getOrder, deleteOrder, createOrder, verifyPayment, getPayments, detail, adminOrders, updateStatus, location, reconcile } = require("../controller/commerceController");

// Controllers
const {
  getFood,
  addFood,
  addBulk,
  updateFood,
  deleteFood,
  review,
  addFavorites,
  adminAnalytics,
} = require("../controller/authController");

// Middlewares
const authMiddleware = require("../middleware/AuthMiddleware");
const isAdmin = require("../middleware/AdminMiddleware");
const { authLimit } = require("../middleware/authLimit");
router.get("/payment-config", require("../controller/commerceController").paymentConfig);

// =========================
// Auth Routes
// =========================
router.post("/signup", authLimit, signup);
router.post("/login", authLimit, loginUser);

// =========================
// Public Routes
// =========================
router.get("/food", getFood);
router.get("/restaurants", require("../controller/restaurantsController").demos);

// =========================
// User-Protected Routes
// =========================
router.post("/orders", authMiddleware, order);
router.get("/orders/:userId", authMiddleware, getOrder);
router.delete("/orders/:orderId", authMiddleware, deleteOrder);

// Razorpay Payment Routes
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.get("/payment/:paymentId", authMiddleware, getPayments);

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

router.get("/order-details/:orderId", authMiddleware, detail);
router.post("/order-details/:orderId/reconcile", authMiddleware, reconcile);
router.get("/admin/orders", authMiddleware, isAdmin, adminOrders);
router.patch("/admin/orders/:orderId/status", authMiddleware, isAdmin, updateStatus);
router.patch("/admin/orders/:orderId/location", authMiddleware, isAdmin, location);
module.exports = router;
