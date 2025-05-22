const mongoose = require("mongoose");
require("dotenv").config(); // Ensure environment variables are loaded

const URI = process.env.URI;

const mongodb = async () => {
    try {
        await mongoose.connect(URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
};

module.exports = mongodb;
