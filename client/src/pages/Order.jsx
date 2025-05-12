import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("User ID not found. Please log in.");

        const { data } = await axios.get(`http://localhost:3100/api/orders/${userId}`, {
          headers: { "Content-Type": "application/json" },
        });

        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.message || "Failed to fetch orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">📦 My Orders</h2>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <p className="text-center text-danger">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-warning">No orders found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Image</th>
                <th>Items</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order._id}>
                  <td>{index + 1}</td>
                  <td>{order._id}</td>
                  <td>
                    <img
                      src={order.items?.[0]?.image || "https://via.placeholder.com/80"}
                      alt="Food Item"
                      className="img-fluid rounded"
                      style={{ width: "70px", height: "70px", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/80"; }}
                    />
                  </td>
                  <td>
                    <ul className="list-unstyled mb-0">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} ({item.quantity} x ₹{item.price})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>₹{order.totalAmount || order.items.reduce((acc, item) => acc + item.quantity * item.price, 0)}</td>
                  <td>
                    <span className={`badge ${order.status === "Delivered" ? "bg-success" : order.status === "Processing" ? "bg-info" : "bg-warning"}`}>
                      {order.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
