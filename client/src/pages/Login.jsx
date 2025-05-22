import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login({ handleLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL; // Ensure this is set correctly in your environment

const response = await fetch(`${API_URL}/login`, {
    method: "POST",
      mode: "cors", // very important!

    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData), // Ensure formData is defined and contains the necessary data
    credentials: "include",
});


      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed! Try again.");
      if (!data.userId || !data.role) throw new Error("Unexpected response: userId or role missing!");

      // Save user data to localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("isAdmin", data.role === "admin"); // ✅ Store admin flag

      handleLogin(); // ✅ Set authentication and admin status
      navigate("/");

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#2C3E50" }}>
      <div className="card p-4 shadow-lg" style={{ width: "350px", borderRadius: "15px", backgroundColor: "#34495E", color: "#fff" }}>
        <h3 className="text-center mb-4">Login</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ borderRadius: "10px" }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ borderRadius: "10px" }}
            />
          </div>
          <button
            type="submit"
            className="btn w-100 text-white"
            style={{ backgroundColor: "#E67E22", borderRadius: "10px" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div className="text-center mt-3">
            <small>
              New user? <Link to="/signup" className="text-warning">Signup</Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
