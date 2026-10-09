import { API_URL } from "../config/api";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

  useEffect(() => {
    const incomingTotal = location?.state?.cartTotal;
    setCartTotal(incomingTotal || 0);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, [location]);

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return alert("Please login to continue.");
      if (!cartTotal || cartTotal <= 0) return alert("Invalid total amount.");

      // 1️⃣ Create order on backend
      const response = await axios.post(
        `${API_URL}/api/create-order`,
        { amount: cartTotal }, // Backend converts rupees to paise
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const order = response.data.order;

      // 2️⃣ Razorpay checkout options
      const options = {
        key: RZP_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Food Mania",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (paymentResponse) {
          try {
            const verifyRes = await axios.post(
              `${API_URL}/api/verify-payment`,
              paymentResponse,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
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

      // 3️⃣ Open Razorpay modal
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
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
