import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
    console.log("🔹 Retrieved userId:", storedUserId);
  }, []); // ✅ Remove cart dependency to prevent unnecessary re-renders

  // ✅ Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item._id !== itemId));
  };

  // ✅ Handle quantity change in cart
  const updateQuantity = (itemId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(1, (item.quantity || 1) + change) }
            : item
        )
        .filter((item) => item.quantity > 0) // ✅ Remove item if quantity becomes 0
    );
  };

  // ✅ Calculate total price safely
  const totalPrice = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  // ✅ Place Order with Geolocation
  const placeOrder = async () => {
    console.log("🔹 User ID before placing order:", userId);

    if (!userId) {
      alert("User not logged in. Please login first.");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty. Add items before placing an order.");
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          console.log("📍 User Location:", userLocation);

          const orderData = {
            userId,
            items: cart,
            totalPrice,
            customerLocation: userLocation,
          };

          console.log("🚀 Sending order:", orderData);

          try {
           const API_URL = import.meta.env.VITE_API_URL;

const response = await fetch(`${API_URL}/orders`, {
  method: "POST",
   credentials: "include", // send cookies
    mode: "cors", // tell browser this is a cross-origin request
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(orderData),
});


            const data = await response.json();
            if (response.ok) {
              alert("✅ Order placed successfully!");
              
            } else {
              alert(`❌ Failed to place order: ${data.error || "Unknown error"}`);
            }
          } catch (error) {
            console.error("❌ Order error:", error);
            alert("Something went wrong! Check the console for details.");
          }
        },
        (error) => {
          console.error("❌ Location Error:", error);
          alert("⚠ Location access denied. Please enable GPS and try again.");
        }
      );
    } catch (error) {
      console.error("❌ Unexpected Error:", error);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">🛒 Your Shopping Cart</h2>

      {cart.length === 0 ? (
        <p className="text-center mt-4">Your cart is empty.</p>
      ) : (
        <>
          <div className="row">
            {cart.map((item) => (
              <div key={item._id} className="col-md-4 mb-4">
                <div className="card shadow" style={{ width: "18rem" }}>
                  <img
                    src={item.image || "https://via.placeholder.com/200"}
                    className="card-img-top"
                    alt={item.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text">₹{(item.price || 0).toFixed(2)}</p>

                    {/* Quantity Controls */}
                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => updateQuantity(item._id, -1)}
                      >
                        -
                      </button>
                      <span className="mx-2">{item.quantity || 1}</span>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => updateQuantity(item._id, 1)}
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      className="btn btn-outline-danger mt-2 w-100"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="text-center mt-4">
            <h4>Total Price: ₹{totalPrice.toFixed(2)}</h4>
            <button className="btn btn-success mt-3 px-4" onClick={placeOrder}>
              Place Order
            </button>
            <button
  className="btn btn-primary mt-3 px-4"
  onClick={() => navigate("/checkOut", { state: { cartTotal: totalPrice } })}
>
  Checkout
</button>
</div>
        </>
      )}
    </div>
  );
}

// ✅ Add Prop Types for SonarQube Compliance
Cart.propTypes = {
  cart: PropTypes.array.isRequired,
  setCart: PropTypes.func.isRequired,
};
