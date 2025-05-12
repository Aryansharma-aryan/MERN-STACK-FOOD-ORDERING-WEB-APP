import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Spinner } from "react-bootstrap";
import OrderTrackingMap from "./OrderTrackingMap";
import "bootstrap/dist/css/bootstrap.min.css";



export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("User ID not found. Please log in.");

        const response = await axios.get(`http://localhost:3100/api/orders/${userId}`, {
          headers: { "Content-Type": "application/json" },
        });

        setOrders(response.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.message || "Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleTrackOrder = (location) => {
    if (!location || !location.lat || !location.lng) {
      alert("⚠️ Location data is not available for this order.");
      return;
    }
    setSelectedLocation({ latitude: location.lat, longitude: location.lng });
    setShowModal(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await axios.delete(`http://localhost:3100/api/orders/${orderId}`);
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("❌ Failed to delete order. Please try again.");
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
          {orders.map((order) => (
            <div key={order._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-lg border-0 rounded-4">
                <div className="card-body">
                  <h5 className="card-title fw-bold">Order ID: {order._id}</h5>
                  <p className="text-muted">
                    <span className="fw-bold">Status:</span>{" "}
                    <span className={`badge ${order.status === "Delivered" ? "bg-success" : order.status === "Processing" ? "bg-info" : "bg-warning"}`}>
                      {order.status || "Pending"}
                    </span>
                  </p>

                  <img
                    src={order.items?.[0]?.image || "https://via.placeholder.com/100"}
                    alt="Food Item"
                    className="img-fluid rounded mb-3"
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/100"; }}
                  />

                  <ul className="list-unstyled">
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.name} ({item.quantity} x ₹{item.price})</li>
                    ))}
                  </ul>
                  <p className="fw-bold">
                    Total: ₹
                    {order.totalAmount || order.items.reduce((acc, item) => acc + item.quantity * item.price, 0)}
                  </p>

                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleTrackOrder(order.location)}>
                    📍 Track Order
                  </button>

                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteOrder(order._id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Tracking Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Track Your Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLocation ? (
            <OrderTrackingMap latitude={selectedLocation.latitude} longitude={selectedLocation.longitude} />
          ) : (
            <p className="text-center text-danger">⚠️ No location data available.</p>
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
}
