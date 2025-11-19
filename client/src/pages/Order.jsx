import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId) throw new Error("User ID not found. Please log in.");

        if (!token) throw new Error("Authentication token missing. Please log in again.");

        const { data } = await axios.get(
          `https://mern-stack-food-ordering-web-app-2.onrender.com/api/orders/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // 🔥 MUST ADD THIS
            },
            timeout: 7000,
            signal: controller.signal,
          }
        );

        setOrders(data);
      } catch (err) {
        console.error("Order Fetch Error:", err);

        if (axios.isCancel(err)) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load orders. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    return () => controller.abort();
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
        <p className="text-center text-danger fw-bold">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-warning">No orders found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped text-center align-middle">
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
              {orders.map((order, index) => {
                const totalPrice =
                  order.totalAmount ??
                  order.items.reduce(
                    (acc, item) => acc + item.quantity * item.price,
                    0
                  );

                return (
                  <tr key={order._id}>
                    <td>{index + 1}</td>
                    <td>{order._id}</td>

                    <td>
                      <img
                        src={
                          order.items?.[0]?.image ||
                          "https://via.placeholder.com/80"
                        }
                        alt="Food"
                        className="img-fluid rounded"
                        style={{
                          width: "70px",
                          height: "70px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80";
                        }}
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

                    <td>₹{totalPrice.toFixed(2)}</td>

                    <td>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default memo(Order);
