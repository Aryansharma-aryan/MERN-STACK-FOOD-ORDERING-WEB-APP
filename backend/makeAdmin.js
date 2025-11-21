const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const mongodb = require("./db/db"); // your db connection function

const adminEmails = [
  "arsharma2951@gmail.com",
  "sanjay@gmail.com",
  "thirduser@example.com",
];

const run = async () => {
  try {
    await mongodb(); // connect to MongoDB

    for (let email of adminEmails) {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`⚠️ User not found: ${email}`);
        continue;
      }
      user.role = "admin";
      await user.save();
      console.log(`✅ ${email} is now an admin.`);
    }

    console.log("🎉 All admin updates complete.");
    process.exit(0); // exit successfully
  } catch (error) {
    console.error("❌ Error assigning admin roles:", error);
    process.exit(1); // exit with error
  }
};

run();
