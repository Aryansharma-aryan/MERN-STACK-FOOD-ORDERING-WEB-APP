import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const incomingTotal = location?.state?.cartTotal;
    setCartTotal(incomingTotal || 0);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please login to continue.");
        return;
      }

      if (!cartTotal) {
        alert("Invalid total.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/create-order`,
        { amount: cartTotal },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const order = response.data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Food Mania",
        description: "Food Payment",
        order_id: order.id,

        handler: function (paymentResponse) {
          alert("Payment Successful!");

          const userId = localStorage.getItem("userId");
          if (userId) localStorage.removeItem(`cart_${userId}`);

          navigate(`/payment/${paymentResponse.razorpay_payment_id}`);
        },

        theme: {
          color: "#0a5",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (err) => {
        alert("Payment Failed!");
        console.error(err);
      });

      razorpay.open();
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment failed.");
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
