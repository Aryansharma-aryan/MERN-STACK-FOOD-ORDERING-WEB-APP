const express = require("express");



const {signup, loginUser, deleteFood,updateFood,addFood, addBulk, getPayments,getFood, order, getOrder,deleteOrder,createOrder, verifyPayment  } = require("../controller/authController"); 
const {review,adminAnalytics,addFavorites} = require("../controller/authController")
const router = express.Router();
const isAdmin=require("../middleware/AdminMiddleware")

// Authentication Routes
router.post("/signup" ,signup);
router.post('/login', loginUser);

// Food Routes
router.post("/addFood", addFood);
router.post("/addBulk", addBulk);
router.get("/food", getFood);

// Order Routes
router.post("/orders", order); // More RESTful than "/order"
router.get("/orders/:userId",getOrder); // Avoids conflicts with "/:userId"
router.delete("/orders/:orderId", deleteOrder); // More RESTful than "/:orderId"
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/payment/:paymentId", getPayments);
//review route

router.post("/:id/review", review);  // Make sure the route is registered
router.post("/:id/favorite", addFavorites);  // Make sure the route is registered
router.get("/adminAnalytics", adminAnalytics);  // Make sure the route is registered


router.get("/admin/dashboard", isAdmin, (req, res) => {
    // Only admins can access this route
    res.json({ message: "Welcome to the admin dashboard!" });
  });

router.put('/updateFood/:id', updateFood);
router.delete('/deleteFood/:id', deleteFood)
  




module.exports = router;
