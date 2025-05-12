import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/logo.jpeg";

const Navbar = ({ cart = [], handleLogout, isAdmin }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update auth status on location change
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  }, [location]);

  return (
    <nav
      className="navbar navbar-expand-lg px-4 py-1 shadow"
      style={{ backgroundColor: "#0A192F" }}
    >
      <div className="container-fluid">
        {/* Logo & Brand */}
        <Link
          className="navbar-brand fw-bold fs-4 d-flex align-items-center"
          to={isAuthenticated ? "/" : "/login"}
          style={{ color: "#FFA500" }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: "50px", height: "50px", marginRight: "10px" }}
          />
          Food Mania
        </Link>

        {/* Navbar Toggler for mobile */}
        {isAuthenticated && (
          <button
            className="navbar-toggler text-white"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        )}

        {/* Navbar Menu */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-light mx-2" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light mx-2" to="/myOrders">My Orders</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning mx-2 fw-bold" to="/cart">
                    🛒 Cart <span className="badge bg-light text-dark">{cart.length}</span>
                  </Link>
                </li>

                {/* Show only for Admin */}
                {isAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link text-info mx-2" to="/admin">
                      Admin Dashboard
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <button className="btn btn-danger mx-2" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-primary mx-2" to="/login">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
