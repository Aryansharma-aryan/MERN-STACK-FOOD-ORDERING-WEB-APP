const express = require("express");



const {signup, loginUser, deleteFood,updateFood,addFood, addBulk, getPayments,getFood, order, getOrder,deleteOrder,createOrder, verifyPayment  } = require("../controller/authController"); 
const {review,adminAnalytics,addFavorites} = require("../controller/authController")
const router = express.Router();
const isAdmin=require("../middleware/AdminMiddleware")
const authMiddleware=require("../middleware/AuthMiddleware")

// Auth Routes
router.post("/signup", signup);
router.post("/login", loginUser);

// Public Routes (Anyone can view food)
router.get("/food", getFood);

// Protected Routes (Only logged-in users)
router.post("/orders", authMiddleware, order);
router.get("/orders/:userId", authMiddleware, getOrder);
router.delete("/orders/:orderId", authMiddleware, deleteOrder);
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.get("/payment/:paymentId",  getPayments);

// Reviews & Favorites (Only logged-in users)
router.post("/:id/review", authMiddleware, review);
router.post("/:id/favorite", authMiddleware, addFavorites);

// Admin Routes (Only admins)
router.post("/addFood", authMiddleware, isAdmin, addFood);
router.post("/addBulk", authMiddleware, isAdmin, addBulk);
router.put("/updateFood/:id", authMiddleware, isAdmin, updateFood);
router.delete("/deleteFood/:id", authMiddleware, isAdmin, deleteFood);
router.get("/adminAnalytics", authMiddleware, isAdmin, adminAnalytics);
router.get("/admin/dashboard", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Welcome to the admin dashboard!" });
});




module.exports = router;
