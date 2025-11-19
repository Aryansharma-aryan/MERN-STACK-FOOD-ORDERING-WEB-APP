const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_RhYEJDxeYx80yK",
  key_secret: "piin4X6KArptWDZtWMz5lalV"
});

(async () => {
  try {
    const order = await razorpay.orders.create({
      amount: 100, // 1 INR in paise
      currency: "INR",
      receipt: "test_receipt_1",
      payment_capture: 1
    });
    console.log("✅ Order created successfully:", order);
  } catch (err) {
    console.error("❌ Error creating order:", err);
  }
})();
