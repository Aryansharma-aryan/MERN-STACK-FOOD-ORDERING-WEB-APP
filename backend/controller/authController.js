const mongoose = require("mongoose");
const Food = require('../models/FoodData');  // path may vary
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const Order = require("../models/OrderModel");

const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const Payment=require("../models/PaymentModel")
const crypto = require("crypto");



const JWT_SECRET = "TFYUG67T67T762"; // Move to .env file later

/**
 * Sign up a new user
 */
const bcrypt = require("bcryptjs");




const signup = async (req, res) => {
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 2. Extract data
    const { name, email, password, role = "user" } = req.body;

    // 3. Check if user exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 4. Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the new user
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    // 6. OPTIONAL: create the admin user once
    const adminEmail = 'arsharma2951@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminPass = process.env.ADMIN_PASS || 'SecureAdminPass123';
      const adminHash = await bcrypt.hash(adminPass, 10);
      const adminUser = new User({
        name: 'Aryan Sharma',
        email: adminEmail,
        password: adminHash,
        role: 'admin',
      });
      await adminUser.save();
      console.log('✅ Admin account created');
    }

    // 7. Create JWT for new user
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 8. Send cookie & response
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    return res.status(201).json({ message: "User created successfully", token });

  } catch (error) {
    next(error); // Pass to Express error handler
  }
};

const loginUser = async (req, res) => {
  try {
    // ✅ Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });
    }

    const { email, password } = req.body;

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    // ✅ Generate JWT with user id and role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Set token in HTTP-only cookie (optional if using localStorage instead)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000, // 1 hour
    });

    // ✅ Send response
    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      role: user.role,
      token: token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




/**
 * Add a single food item
 */

  // foodController.js or wherever addFood is defined
const addFood = async (req, res) => {
  try {
    const { name, price, description, image } = req.body;

    // Assume you're using a MongoDB model
    const foodItem = new Food({
      name,
      price,
      description,
      image,
    });

    await foodItem.save(); // Save food to the database
    res.status(200).json({ message: "Food item added successfully" });
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({ message: "Error adding food item" });
  }
};


/**
 * Add multiple food items
 */
const addBulk = async (req, res) => {
  try {
    console.log("📌 Received Bulk Food Data:", req.body);

    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: "❌ Data must be an array" });
    }

    const foodItems = await Food.insertMany(req.body);
    res.status(201).json({ message: "✅ Bulk food added!", food: foodItems });
  } catch (error) {
    console.error("❌ Error adding bulk food:", error);
    res.status(500).json({ message: "❌ Internal Server Error", error });
  }
};

/**
 * Fetch all food items
 */
const getFood = async (req, res) => {
  try {
    const foods = await Food.find();
    res.status(200).json(foods);
  } catch (error) {
    console.error("❌ Error fetching food:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};

/**
 * Place a new order
 */
const order = async (req, res) => {
  try {
    const { items, totalPrice, userId, customerLocation } = req.body;

    if (!customerLocation || !customerLocation.lat || !customerLocation.lng) {
      return res.status(400).json({ error: "Customer location is required!" });
    }

    const newOrder = new Order({
      items,
      totalPrice,
      userId,
      customerLocation, // ✅ Ensure it’s saved
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully!", order: newOrder });
  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ error: "Error placing order", details: error.message });
  }
};

/**
 * Get all orders of a user
 */
const getOrder = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId });

    // Ensure every order has a location
    const ordersWithLocation = orders.map(order => ({
      ...order.toObject(),
      location: order.location || { lat: 28.7041, lng: 77.1025 } // Default location
    }));
    

    res.json(ordersWithLocation);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

//delete order
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid orderId" });
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully", orderId });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



const razorpay = new Razorpay({
  key_id: "rzp_test_IKvri4H04w6Khy",
  key_secret: "ULNwyV4wHxdKENfjceXWCosW"
});
// Create an order
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const amountInPaise = amount; // ✅ Convert rupees to paise

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      payment_capture: 1,
    });

    // Send the order details back along with the order ID to the frontend
    res.json({ success: true, order, paymentId: order.id });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// Verify payment signature
const verifyPayment = async (req, res) => {
  try {
    console.log("Verifying Payment...", req.body); // Debugging log

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency } = req.body;
    const secret = "ULNwyV4wHxdKENfjceXWCosW"; // Replace with your actual Razorpay Secret

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      // ✅ Save Payment Details in MongoDB
      const payment = new Payment({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        currency,
        status: "success",
        createdAt: new Date(),
      });

      await payment.save();

      res.json({ success: true, message: "Payment Verified & Saved Successfully", payment });
    } else {
      res.status(400).json({ success: false, error: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Error Verifying Payment:", error);
    res.status(500).json({ error: error.message });
  }
};
const getPayments = async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    return res.status(400).json({ error: "Invalid request. No payment ID found." });
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    // Example mock data for demo purpose (replace with real DB lookup in real app)
    const mockOrder = {
      paymentId: payment.id,
      totalAmount: payment.amount / 100,
      paidAt: new Date(payment.created_at * 1000),
      user: "arsharma2951@gmail.com", // Ideally from your DB
      paymentMethod: payment.method || "UPI",
      items: [
        {
          name: "Paneer Pizza",
          image: "https://via.placeholder.com/60",
          price: 250,
          quantity: 1
        },
        {
          name: "Burger Combo",
          image: "https://via.placeholder.com/60",
          price: 275,
          quantity: 1
        }
      ]
    };

    res.json({ payment: mockOrder });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ error: "Error fetching payment details." });
  }
};

const review = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    console.log("Review received:", name, rating, comment); // 👈

    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    food.reviews.push({ name, rating, comment });
    await food.save();

    res.status(200).json({ message: "Review added successfully" });
  } catch (err) {
    console.error("Review POST Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
const addFavorites = async (req, res) => {
  try {
    const foodId = req.params.id;

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      { isFavorite: true },
      { new: true }
    );

    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.status(200).json({ message: `${updatedFood.name} added to favorites!` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update favorite", error: err });
  }
};
const adminAnalytics=async(req,res) => {
  try {
    const dailyOrders = await Order.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } });
    const bestsellers = await Food.aggregate([
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'items.foodId', as: 'orders' }},
      { $project: { name: 1, totalSold: { $size: '$orders' }}},
      { $sort: { totalSold: -1 }}
    ]);
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' }}}
    ]);
    
    res.json({
      dailyOrders,
      bestsellers,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching analytics.' });
  }
}
const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFood = await Food.findByIdAndDelete(id);
    if (!deletedFood) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    console.error("Error deleting food item:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateFood = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid food ID" });
    }

    // Run update with validation enabled
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedFood) {
      return res.status(404).json({ error: "Food item not found" });
    }

    res.json(updatedFood);
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(500).json({ error: error.message });
  }
};










module.exports = {review,adminAnalytics,addFavorites, signup, loginUser, addFood, addBulk, getFood, order, getOrder,deleteOrder,createOrder,verifyPayment ,getPayments,deleteFood,updateFood};
