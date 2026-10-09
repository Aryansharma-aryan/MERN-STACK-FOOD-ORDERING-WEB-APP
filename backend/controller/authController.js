// controllers/appController.js
const mongoose = require("mongoose");
const { foodInput } = require("../utils/validation");

// Models
const User = require("../models/User");
const Food = require("../models/FoodData");
const Order = require("../models/OrderModel");





// Add single food
const addFood = async (req, res) => {
  try {
    const foodItem = new Food(foodInput(req.body));
    await foodItem.save();

    return res.status(201).json({ message: "Food item added successfully", food: foodItem });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    console.error("Error adding food item:", error);
    return res.status(500).json({ message: "Error adding food item" });
  }
};

// Add bulk food
const addBulk = async (req, res) => {
  try {
    if (!Array.isArray(req.body) || !req.body.length || req.body.length > 100) return res.status(400).json({ message: "Provide between 1 and 100 food objects." });
    const docs = req.body.map(foodInput);

    const foodItems = await Food.insertMany(docs);
    return res.status(201).json({ message: "Bulk food added!", food: foodItems });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    console.error("Error adding bulk food:", error);
    return res.status(500).json({ message: "Unable to import products." });
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
    const { rating, comment = "" } = req.body || {};
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || typeof comment !== "string" || comment.length > 2000) return res.status(400).json({ message: "Use a rating from 1 to 5 and a comment of at most 2000 characters." });
    const foodId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(foodId)) return res.status(400).json({ error: "Invalid food id" });

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ error: "Food item not found" });

    const reviewObj = { name: req.user.name, rating: Number(rating), comment: comment.trim(), createdAt: new Date() };
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

    const updatedFood = await Food.findById(foodId);
    if (!updatedFood) return res.status(404).json({ message: "Food not found" });
    await User.updateOne({ _id: req.user.id }, { $addToSet: { favorites: foodId } });

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
      { $match: { paymentStatus: "paid" } },
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

    const updatedFood = await Food.findByIdAndUpdate(foodId, { $set: foodInput(req.body) }, { new: true, runValidators: true });
    if (!updatedFood) return res.status(404).json({ error: "Food item not found" });

    return res.json(updatedFood);
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    console.error("Error updating food:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ----------------- Export -----------------
module.exports = {
  addFood,
  addBulk,
  getFood,
  review,
  addFavorites,
  adminAnalytics,
  deleteFood,
  updateFood,
};
