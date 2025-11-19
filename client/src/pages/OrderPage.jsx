import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import { Modal, Button, Spinner } from "react-bootstrap";
import OrderTrackingMap from "./OrderTrackingMap";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = "https://mern-stack-food-ordering-web-app-2.onrender.com/api";

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("authToken");

        if (!userId || !token) throw new Error("Please log in again.");

        const { data } = await axios.get(`${API_BASE}/orders/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          timeout: 7000, // Prevent long waiting
          withCredentials: true,
        });

        setOrders(data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Order fetch error:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to fetch orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    return () => controller.abort();
  }, []);

  const handleTrackOrder = (location) => {
    if (!location?.lat || !location?.lng) {
      alert("⚠️ Live location not available for this order.");
      return;
    }

    setSelectedLocation({
      latitude: location.lat,
      longitude: location.lng,
    });

    setShowModal(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = localStorage.getItem("authToken");

      await axios.delete(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("❌ Failed to delete order. Try again.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 fw-bold">📦 My Orders</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <p className="text-center text-danger fw-bold">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-warning fw-bold">No orders found.</p>
      ) : (
        <div className="row">
          {orders.map((order) => {
            const totalPrice =
              order.totalAmount ??
              order.items.reduce(
                (sum, item) => sum + item.quantity * item.price,
                0
              );

            return (
              <div key={order._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-lg border-0 rounded-4">
                  <div className="card-body">
                    <h5 className="card-title fw-bold">Order ID: {order._id}</h5>

                    <p className="text-muted">
                      <span className="fw-bold">Status:</span>{" "}
                      <span
                        className={`badge ${
                          order.status === "Delivered"
                            ? "bg-success"
                            : order.status === "Processing"
                            ? "bg-info"
                            : "bg-warning"
                        }`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </p>

                    <img
                      src={
                        order.items?.[0]?.image ||
                        "https://via.placeholder.com/100"
                      }
                      alt="Food Item"
                      className="img-fluid rounded mb-3"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/100";
                      }}
                    />

                    <ul className="list-unstyled">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} ({item.quantity} x ₹{item.price})
                        </li>
                      ))}
                    </ul>

                    <p className="fw-bold">Total: ₹{totalPrice}</p>

                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => handleTrackOrder(order.location)}
                    >
                      📍 Track
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteOrder(order._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Tracking */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Track Your Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLocation ? (
            <OrderTrackingMap
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
            />
          ) : (
            <p className="text-center text-danger">
              ⚠️ Location not available.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default memo(OrderPage);
