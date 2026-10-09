const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{ foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" }, name: String, quantity: Number, price: Number, image: String }],
  totalAmount: Number,
  subtotal: Number,
  tax: Number,
  deliveryAddress: String,
  phone: String,
  paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
  razorpayOrderId: String,
  paymentId: String,
  paidAt: Date,
  locationUpdatedAt: Date,
  requestId: String,
  
  // Customer's Delivery Location
  customerLocation: {
    type: {
      lat: Number,
      lng: Number
    },
    default: null
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
    enum: ["Awaiting Payment", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
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

orderSchema.index({ userId: 1, requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: "string" } } });
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
