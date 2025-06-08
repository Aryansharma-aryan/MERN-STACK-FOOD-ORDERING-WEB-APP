const express = require("express");



const {signup, login, deleteFood,updateFood,addFood, addBulk, getPayments,getFood, order, getOrder,deleteOrder,validateSignup, validateLogin,createOrder, verifyPayment  } = require("../controller/authController"); 
const {review,adminAnalytics,addFavorites} = require("../controller/authController")
const router = express.Router();
const isAdmin=require("../middleware/AdminMiddleware")

// Authentication Routes
router.post("/signup",validateSignup ,signup);
router.post("/login",validateLogin, login);

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

  // update food
router.put("/updateFood/:id", async (req, res) => {
 try {
    const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    res.json({ message: "Food updated successfully", food: updatedFood });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// delete food
router.delete("/deleteFood/:id", async (req, res) => {
 try {
    const deletedFood = await Food.findByIdAndDelete(req.params.id);
    if (!deletedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    res.json({ message: "Food deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

  




module.exports = router;
