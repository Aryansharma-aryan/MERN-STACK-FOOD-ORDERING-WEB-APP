const mongoose = require("mongoose");

const URI = process.env.URI || "mongodb+srv://arsharma2951:aryan2951@cluster0.d2ryr.mongodb.net/practice"

const mongodb = async () => {
    try {
        await mongoose.connect(URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
};

module.exports = mongodb;
