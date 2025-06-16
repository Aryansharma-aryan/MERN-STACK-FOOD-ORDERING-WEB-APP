import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const incomingTotal = location?.state?.cartTotal;

    // Safely set cart total
    if (typeof incomingTotal === "number" && !isNaN(incomingTotal)) {
      setCartTotal(incomingTotal);
    } else {
      console.warn("Cart total is missing or invalid. Setting to 0.");
      setCartTotal(0);
    }

    // Load Razorpay script
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, [location.state]);

  const handlePayment = async () => {
    try {
      const amountInPaise = cartTotal * 100; // convert ₹ to paise

      const response = await axios.post(
        `https://mern-stack-food-ordering-web-app-2.onrender.com/api/create-order`,
        {
          amount: amountInPaise,
        }
      );

      if (!response.data.success || !response.data.order || !response.data.order.id) {
        alert("Failed to initiate payment.");
        return;
      }

      const { order } = response.data;

      const options = {
        key: "rzp_test_IKvri4H04w6Khy",
        amount: order.amount,
        currency: order.currency,
        name: "Food Mania",
        description: "Food Order Payment",
        order_id: order.id,
        handler: function (paymentResponse) {
          alert(`Payment Successful! Payment ID: ${paymentResponse.razorpay_payment_id}`);
          navigate(`/payment/${paymentResponse.razorpay_payment_id}`);
        },
        prefill: {
          name: "Aryan Sharma",
          email: "arsharma2951@gmail.com",
          contact: "+91 9518403808",
        },
        theme: { color: "#F37254" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment Error:", error.response?.data || error.message);
      alert("Payment failed: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-lg border-0">
            <div className="card-header text-center bg-primary text-white">
              <h2>Checkout</h2>
            </div>
            <div className="card-body text-center">
              <h4 className="text-muted">Total Amount</h4>
              <h2 className="fw-bold text-success">₹{cartTotal.toFixed(2)}</h2>
              <button
                className="btn btn-lg btn-success mt-3 w-100"
                onClick={handlePayment}
                disabled={!razorpayLoaded || cartTotal === 0}
              >
                {razorpayLoaded ? "Pay Now" : "Loading Payment..."}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
