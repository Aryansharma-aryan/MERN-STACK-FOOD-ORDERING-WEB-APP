import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/logo.jpeg";

const Navbar = ({ cart = [], handleLogout, isAdmin }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Update auth status and close menu on route change
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav
      className="navbar px-4 py-1 shadow"
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

        {/* Always show Navbar Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
          style={{ filter: "invert(1)" }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Menu */}
        <div
          className={`justify-content-end ${
            isMenuOpen ? "d-flex" : "d-none"
          } navbar-collapse`}
          id="navbarNav"
        >
          <ul className="navbar-nav align-items-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-light mx-2" to="/">
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light mx-2" to="/myOrders">
                    My Orders
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning mx-2 fw-bold" to="/cart">
                    🛒 Cart{" "}
                    <span className="badge bg-light text-dark">{cart.length}</span>
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
