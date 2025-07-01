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
    setError("");

    try {
      const response = await fetch(
        `https://mern-stack-food-ordering-web-app-2.onrender.com/api/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          mode: "cors",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Login failed! Try again.");
      if (!data.userId || !data.role || !data.token)
        throw new Error("Incomplete login response from server.");

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("isAdmin", data.role === "admin");

      handleLogin(); // update context or state
      navigate("/");
    } catch (error) {
      console.error("Login error:", error.message);
      setError(error.message || "Login failed!");
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
        style={{
          width: "350px",
          borderRadius: "15px",
          backgroundColor: "#34495E",
          color: "#fff",
        }}
      >
        <h3 className="text-center mb-4">Login</h3>

        {error && (
          <div className="alert alert-danger text-center py-2">{error}</div>
        )}

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
              disabled={loading}
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
              disabled={loading}
              style={{ borderRadius: "10px" }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 text-white"
            style={{ backgroundColor: "#E74C3C", borderRadius: "10px" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm text-light me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <div className="text-center mt-3">
            <small>
              New user?{" "}
              <Link to="/signup" className="text-warning">
                Signup
              </Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
