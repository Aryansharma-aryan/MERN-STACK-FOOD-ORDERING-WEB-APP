import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // Load userId & cart from localStorage (user-specific)
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);

      const userCart = localStorage.getItem(`cart_${storedUserId}`);
      try {
        const parsedCart = JSON.parse(userCart || "[]");
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error("Error parsing user cart:", error);
        setCart([]);
      }
    }
  }, []);

  // Save cart to localStorage (user-specific)
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    }
  }, [cart, userId]);

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

  const subtotal = Array.isArray(cart)
    ? cart.reduce(
        (total, item) => total + (item.price || 0) * (item.quantity || 1),
        0
      )
    : 0;

  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  const totalPrice = subtotal + tax;

  const placeOrder = async () => {
    if (!userId) return alert("Please login first.");
    if (!Array.isArray(cart) || cart.length === 0)
      return alert("Cart is empty.");

    setLoading(true);
    setMessage(null);

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
          const response = await fetch(
            `https://mern-stack-food-ordering-web-app-2.onrender.com/api/orders`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              mode: "cors",
              body: JSON.stringify(orderData),
            }
          );

          const data = await response.json();
          if (response.ok) {
            setMessage("✅ Order placed successfully!");
            setCart([]);
            localStorage.removeItem(`cart_${userId}`);
          } else {
            setMessage(`❌ Failed: ${data.error || "Unknown error"}`);
          }
        } catch (err) {
          setMessage("❌ Error placing order.");
          console.error(err);
        }

        setLoading(false);
      },
      () => {
        setLoading(false);
        alert("⚠ Location access denied.");
      }
    );
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

      {!Array.isArray(cart) || cart.length === 0 ? (
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
              onClick={() =>
                navigate("/checkOut", { state: { cartTotal: totalPrice } })
              }
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

// ✅ Prop types
Cart.propTypes = {
  cart: PropTypes.array.isRequired,
  setCart: PropTypes.func.isRequired,
};

// ✅ Default props
Cart.defaultProps = {
  cart: [],
};
