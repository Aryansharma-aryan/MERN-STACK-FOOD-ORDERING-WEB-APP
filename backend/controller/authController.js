// controllers/appController.js
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/User");
const Food = require("../models/FoodData");
const Order = require("../models/OrderModel");
const JWT_SECRET = process.env.JWT_SECRET;


if (!JWT_SECRET) console.warn("⚠️ JWT_SECRET is not set in environment variables.");



// ----------------- Controllers -----------------

// Signup
// ----------------- Controllers -----------------

// Signup
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const role = "user";
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    // Ensure admin account creation if env vars exist
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASS;
    if (adminEmail && adminPass) {
      const adminExists = await User.findOne({ email: adminEmail });
      if (!adminExists) {
        const adminHash = await bcrypt.hash(adminPass, 10);
        const adminUser = new User({
          name: process.env.ADMIN_NAME || "Admin",
          email: adminEmail,
          password: adminHash,
          role: "admin",
        });
        await adminUser.save();
        console.log("✅ Admin account created (from env)");
      }
    }

    // Sign JWT with role
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    return res.status(201).json({
      message: "User created successfully",
      token,
      userId: newUser._id,
      role: newUser.role,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return next(error);
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });

    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password." });

    // Always include role in token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000,
    });

    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// Add single food
const addFood = async (req, res) => {
  try {
    const { name, price, description, image } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required." });

    const foodItem = new Food({ name, price: Number(price) || 0, description: description || "", image: image || "" });
    await foodItem.save();

    return res.status(201).json({ message: "Food item added successfully", food: foodItem });
  } catch (error) {
    console.error("Error adding food item:", error);
    return res.status(500).json({ message: "Error adding food item" });
  }
};

// Add bulk food
const addBulk = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ message: "Data must be an array of food objects." });

    const docs = req.body.map(item => ({
      name: item.name,
      price: Number(item.price) || 0,
      description: item.description || "",
      image: item.image || "",
    }));

    const foodItems = await Food.insertMany(docs);
    return res.status(201).json({ message: "Bulk food added!", food: foodItems });
  } catch (error) {
    console.error("Error adding bulk food:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all food
const getFood = async (req, res) => {
  try {
    const foods = await Food.find().lean();
    return res.status(200).json(foods);
  } catch (error) {
    console.error("Error fetching food:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add review
const review = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const foodId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(foodId)) return res.status(400).json({ error: "Invalid food id" });

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ error: "Food item not found" });

    const reviewObj = { name: name || "Anonymous", rating: Number(rating) || 0, comment: comment || "", createdAt: new Date() };
    food.reviews = food.reviews || [];
    food.reviews.push(reviewObj);
    await food.save();

    return res.status(200).json({ message: "Review added successfully" });
  } catch (err) {
    console.error("Review POST Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Add to favorites
const addFavorites = async (req, res) => {
  try {
    const foodId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(foodId)) return res.status(400).json({ message: "Invalid food id" });

    const updatedFood = await Food.findByIdAndUpdate(foodId, { $set: { isFavorite: true } }, { new: true });
    if (!updatedFood) return res.status(404).json({ message: "Food not found" });

    return res.status(200).json({ message: `${updatedFood.name} added to favorites!`, food: updatedFood });
  } catch (err) {
    console.error("Error updating favorite:", err);
    return res.status(500).json({ message: "Failed to update favorite", error: err.message });
  }
};

// Admin analytics
const adminAnalytics = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyOrders = await Order.countDocuments({ createdAt: { $gte: startOfDay } });

    const bestsellers = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.foodId", sold: { $sum: "$items.quantity" } } },
      { $sort: { sold: -1 } },
      { $limit: 10 },
      { $lookup: { from: "foods", localField: "_id", foreignField: "_id", as: "food" } },
      { $unwind: { path: "$food", preserveNullAndEmptyArrays: true } },
      { $project: { foodName: "$food.name", sold: 1 } },
    ]);

      const revenueAgg = await Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    return res.json({ dailyOrders, bestsellers, totalRevenue });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ message: "Error fetching analytics." });
  }
};

// Delete food
const deleteFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(foodId)) return res.status(400).json({ error: "Invalid food id" });

    const deleted = await Food.findByIdAndDelete(foodId);
    if (!deleted) return res.status(404).json({ error: "Food item not found" });

    return res.json({ message: "Food item deleted successfully", foodId: deleted._id });
  } catch (error) {
    console.error("Error deleting food item:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Update food
const updateFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(foodId)) return res.status(400).json({ error: "Invalid food ID" });

    const updatedFood = await Food.findByIdAndUpdate(foodId, req.body, { new: true, runValidators: true });
    if (!updatedFood) return res.status(404).json({ error: "Food item not found" });

    return res.json(updatedFood);
  } catch (error) {
    console.error("Error updating food:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ----------------- Export -----------------
module.exports = {
  signup,
  loginUser,
  addFood,
  addBulk,
  getFood,
  review,
  addFavorites,
  adminAnalytics,
  deleteFood,
  updateFood,
};
