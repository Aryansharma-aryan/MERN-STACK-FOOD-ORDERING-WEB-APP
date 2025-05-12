const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{ name: String, quantity: Number, price: Number, image: String }],
  totalAmount: Number,
  
  // Customer's Delivery Location
  customerLocation: {
    type: {
      lat: Number,
      lng: Number
    },
    required: true
  },
  
  // Delivery Person Info
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  deliveryPersonLocation: {
    type: {
      lat: Number,
      lng: Number
    },
    default: null
  },

  // Order Status with Timestamps
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Pending",
  },
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
    }
  ],

  // Automatic Timestamps
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;