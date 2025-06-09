import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // success/error feedback
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // Load userId & cart from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) setUserId(storedUserId);

    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item._id !== itemId));
    setConfirmRemoveId(null);
    setMessage("Item removed from cart.");
  };

  const updateQuantity = (itemId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(1, (item.quantity || 1) + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  const taxRate = 0.05; // 5% GST
  const tax = subtotal * taxRate;
  const totalPrice = subtotal + tax;

  const placeOrder = async () => {
    if (!userId) {
      alert("User not logged in. Please login first.");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty. Add items before placing an order.");
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const orderData = {
            userId,
            items: cart,
            totalPrice,
            customerLocation: userLocation,
          };

          try {
            const API_URL = import.meta.env.VITE_API_URL;

            const response = await fetch(`${API_URL}/api/orders`, {
              method: "POST",
              credentials: "include",
              mode: "cors",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(orderData),
            });

            const data = await response.json();
            if (response.ok) {
              setMessage("✅ Order placed successfully!");
              setCart([]); // clear cart
              localStorage.removeItem("cart");
            } else {
              setMessage(`❌ Failed to place order: ${data.error || "Unknown error"}`);
            }
          } catch (error) {
            setMessage("❌ Something went wrong. Check console.");
            console.error("Order error:", error);
          }
          setLoading(false);
        },
        (error) => {
          setLoading(false);
          alert("⚠ Location access denied. Please enable GPS and try again.");
        }
      );
    } catch (error) {
      setLoading(false);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">🛒 Your Shopping Cart</h2>

      {message && (
        <div
          className={`alert ${
            message.startsWith("✅") ? "alert-success" : "alert-danger"
          } text-center`}
          role="alert"
        >
          {message}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="text-center mt-4">
          <p>Your cart is empty.</p>
          <img
            src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
            alt="Empty cart"
            style={{ width: "150px", opacity: 0.5 }}
          />
        </div>
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

                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => updateQuantity(item._id, -1)}
                        disabled={item.quantity <= 1}
                        title={item.quantity <= 1 ? "Minimum quantity is 1" : ""}
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

                    <button
                      className="btn btn-outline-danger mt-2 w-100"
                      onClick={() => setConfirmRemoveId(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="text-center mt-4">
            <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p>Tax (5% GST): ₹{tax.toFixed(2)}</p>
            <h4>Total Price: ₹{totalPrice.toFixed(2)}</h4>
          </div>

          <div className="text-center mt-3">
            <button
              className="btn btn-success px-4 me-2"
              onClick={placeOrder}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </button>

            <button
              className="btn btn-primary px-4"
              onClick={() => navigate("/checkOut", { state: { cartTotal: totalPrice } })}
              disabled={loading}
            >
              Checkout
            </button>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmRemoveId && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
          onClick={() => setConfirmRemoveId(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Removal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmRemoveId(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to remove this item from the cart?</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmRemoveId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => removeFromCart(confirmRemoveId)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Cart.propTypes = {
  cart: PropTypes.array.isRequired,
  setCart: PropTypes.func.isRequired,
};
