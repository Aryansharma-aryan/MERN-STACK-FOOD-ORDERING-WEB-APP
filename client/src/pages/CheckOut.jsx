import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  // Load Razorpay script and get cart total
  useEffect(() => {
    const incomingTotal = location?.state?.cartTotal;
    setCartTotal(incomingTotal || 0);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [location]);

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return alert("Please login to continue.");
      if (!cartTotal || cartTotal <= 0) return alert("Invalid total amount.");

      // 1️⃣ Create order in backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/create-order`,
        { amount: cartTotal },
        { headers: { "Content-Type": "application/json" },
            Authorization: `Bearer ${token}`, // ← send token
 }
      );

      const order = response.data.order;

      // 2️⃣ Razorpay checkout options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // your Razorpay key
        amount: order.amount, // in paise
        currency: order.currency,
        name: "Food Mania",
        description: "Food Payment",
        order_id: order.id, // Razorpay order ID

        handler: async function (paymentResponse) {
          // 3️⃣ Verify payment on backend
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/verify-payment`,
              paymentResponse,
              { headers: { "Content-Type": "application/json" } }
            );

            if (verifyRes.data.success) {
              alert("Payment successful!");
              const userId = localStorage.getItem("userId");
              if (userId) localStorage.removeItem(`cart_${userId}`);
              navigate(`/payment/${paymentResponse.razorpay_payment_id}`);
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification Error:", err.response?.data || err);
            alert("Payment verification failed. Check console.");
          }
        },

        theme: { color: "#0a5" },
      };

      // 4️⃣ Open Razorpay checkout
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        alert(`Payment Failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      console.error("Payment Error:", err.response?.data || err);
      alert("Payment failed. Check console.");
    }
  };

  return (
    <div className="container mt-5 text-center">
      <h2>Checkout</h2>
      <h3>Total: ₹{cartTotal}</h3>

      <button
        className="btn btn-success btn-lg mt-3"
        disabled={!razorpayLoaded}
        onClick={handlePayment}
      >
        {razorpayLoaded ? "Pay Now" : "Loading..."}
      </button>
    </div>
  );
};

export default Checkout;
