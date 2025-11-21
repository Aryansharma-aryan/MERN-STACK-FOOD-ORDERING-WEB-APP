import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login({ handleLogin }) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      toast.loading("Logging in...", { toastId: "login" });

      const response = await fetch(
        "https://mern-stack-food-ordering-web-app-2.onrender.com/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          mode: "cors",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Login failed");

      // Save auth info
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("isAdmin", data.role === "admin" ? "true" : "false");
      localStorage.setItem("userRole", data.role);

      toast.update("login", {
        render: "✅ Login successful!",
        type: "success",
        isLoading: false,
        autoClose: 1000,
      });

      handleLogin();

      // Redirect: admins -> /admin, users -> /home
      setTimeout(() => {
        if (data.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }, 500);
    } catch (err) {
      toast.update("login", {
        render: err.message || "❌ Login failed",
        type: "error",
        isLoading: false,
        autoClose: 1500,
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
        <h3 className="text-center mb-4">Login</h3>

        <form onSubmit={handleSubmit(onSubmit)}>
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
            {errors.email && (
              <p className="text-danger mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              {...register("password", { required: "Password is required" })}
              disabled={isSubmitting}
              style={{ borderRadius: "10px" }}
            />
            {errors.password && (
              <p className="text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn w-100 text-white"
            style={{ backgroundColor: "#E74C3C", borderRadius: "10px" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
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
