const mongoose = require("mongoose");


const reviewSchema = new mongoose.Schema({
    name: String,
    rating: { type: Number, required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  });

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    reviews: [reviewSchema], // 🆕 add reviews here
    isFavorite: { type: Boolean, default: false }, // ⭐️ New field


});

const Food = mongoose.model("Food", foodSchema);  // ✅ Ensure model name is "Food"
module.exports = Food;
