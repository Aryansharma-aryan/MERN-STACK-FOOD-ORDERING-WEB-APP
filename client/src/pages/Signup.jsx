import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Signup() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      const response = await fetch(
        `https://mern-stack-food-ordering-web-app-2.onrender.com/api/signup`,
        {
          method: "POST",
          credentials: "include",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("🎉 Signup successful! Redirecting to login...", {
          position: "top-center",
          autoClose: 1500,
        });
        reset();
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(data.message || "❌ Signup failed. Please try again.", {
          position: "top-center",
        });
      }
    } catch (err) {
      console.error("Signup Error:", err);
      toast.error("❌ Something went wrong. Please try again later.", {
        position: "top-center",
      });
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#2C3E50" }}
    >
      <ToastContainer />
      <div
        className="card p-4 shadow-lg"
        style={{
          width: "350px",
          borderRadius: "15px",
          backgroundColor: "#34495E",
          color: "#fff",
        }}
      >
        <h3 className="text-center mb-4">Create Account</h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your name"
              {...register("name", { required: "Name is required" })}
              disabled={isSubmitting}
              style={{ borderRadius: "10px" }}
            />
            {errors.name && <p className="text-danger mt-1">{errors.name.message}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email format",
                },
              })}
              disabled={isSubmitting}
              style={{ borderRadius: "10px" }}
            />
            {errors.email && <p className="text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              disabled={isSubmitting}
              style={{ borderRadius: "10px" }}
            />
            {errors.password && <p className="text-danger mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="btn w-100 text-white"
            style={{ backgroundColor: "#E67E22", borderRadius: "10px" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing Up..." : "Sign Up"}
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
