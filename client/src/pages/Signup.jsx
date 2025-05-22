import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
     const response = await fetch(`${import.meta.env.VITE_API_URL}/api/signup`, {
  method: "POST",
   credentials: "include", // send cookies
    mode: "cors", // tell browser this is a cross-origin request
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});

      const data = await response.json();

      if (response.ok) {
        setFormData({ name: "", email: "", password: "" });
        navigate("/login");
      } else {
        alert(data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#2C3E50" }}>
      <div className="card p-4 shadow-lg" style={{ width: "350px", borderRadius: "15px", backgroundColor: "#34495E", color: "#fff" }}>
        <h3 className="text-center mb-4">Create Account</h3>
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
          <button type="submit" className="btn w-100 text-white" style={{ backgroundColor: "#E67E22", borderRadius: "10px" }}>
            Sign Up
          </button>
          <div className="text-center mt-3">
            <small>Already have an account? <Link to="/login" className="text-warning">Login</Link></small>
          </div>
        </form>
      </div>
    </div>
  );
}
