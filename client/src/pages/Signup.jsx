import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) throw new Error("API URL not defined in environment variables!");

      const response = await fetch(`${API_URL}/api/signup`,
        {
          method: "POST",
          credentials: "include", // if you want to send cookies
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFormData({ name: "", email: "", password: "" });
        navigate("/login");
      } else {
        setError(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#2C3E50" }}
    >
      <div
        className="card p-4 shadow-lg"
        style={{ width: "350px", borderRadius: "15px", backgroundColor: "#34495E", color: "#fff" }}
      >
        <h3 className="text-center mb-4">Create Account</h3>
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ borderRadius: "10px" }}
              disabled={loading}
            />
          </div>
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn w-100 text-white"
            style={{ backgroundColor: "#E67E22", borderRadius: "10px" }}
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
          <div className="text-center mt-3">
            <small>
              Already have an account?{" "}
              <Link to="/login" className="text-warning">
                Login
              </Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
