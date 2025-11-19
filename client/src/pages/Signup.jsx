import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Signup() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  const onSubmit = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Signup failed.");
        return;
      }

      toast.success("🎉 Signup successful!");
      reset();
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      toast.error("Server error. Try again later.",error);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      <ToastContainer />

      <div className="card p-4 shadow-lg bg-secondary text-white" style={{ width: 350, borderRadius: 15 }}>
        <h3 className="text-center mb-4">Create Account</h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Enter your name"
              disabled={isSubmitting}
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="text-danger small">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control rounded-3"
              placeholder="Enter email"
              disabled={isSubmitting}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
              })}
            />
            {errors.email && <p className="text-danger small">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control rounded-3"
              placeholder="Enter password"
              disabled={isSubmitting}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {errors.password && <p className="text-danger small">{errors.password.message}</p>}
          </div>

          {/* Button */}
          <button
            type="submit"
            className="btn btn-warning w-100 rounded-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing Up..." : "Sign Up"}
          </button>

          <div className="text-center mt-3">
            <small>
              Already have an account?{" "}
              <Link to="/login" className="text-warning text-decoration-none">
                Login
              </Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
