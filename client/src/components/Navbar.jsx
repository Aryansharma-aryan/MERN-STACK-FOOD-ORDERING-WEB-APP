import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/logo.jpeg";

const Navbar = ({ cart = [], handleLogout, isAdmin }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      className="navbar navbar-expand-lg px-4 py-2 shadow"
      style={{ backgroundColor: "#0A192F" }}
    >
      <div className="container-fluid">
        {/* Logo & Brand */}
        <Link
          className="navbar-brand fw-bold fs-4 d-flex align-items-center"
          to={isAuthenticated ? "/" : "/login"}
          style={{ color: "#FFA500", textDecoration: "none" }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: 50, height: 50, marginRight: 10 }}
            loading="lazy"
          />
          Food Mania
        </Link>

        {/* Navbar Toggler */}
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
          className={`collapse navbar-collapse justify-content-end ${
            isMenuOpen ? "show d-flex" : "d-none d-lg-flex"
          }`}
          id="navbarNav"
        >
          <ul className="navbar-nav align-items-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link text-light mx-2 px-3 py-2 rounded btn-hover"
                    to="/"
                  >
                    Home
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-light mx-2 px-3 py-2 rounded btn-hover"
                    to="/myOrders"
                  >
                    My Orders
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-warning mx-2 px-3 py-2 rounded fw-bold btn-cart"
                    to="/cart"
                  >
                    🛒 Cart{" "}
                    <span className="badge bg-light text-dark">{cart.length}</span>
                  </Link>
                </li>

                {isAdmin && (
                  <li className="nav-item">
                    <Link
                      className="nav-link mx-2 px-3 py-2 rounded fw-bold admin-btn"
                      to="/admin"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <button
                    className="btn btn-danger mx-2 px-3 py-2 rounded fw-semibold btn-hover"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link
                  className="btn btn-primary mx-2 px-4 py-2 rounded fw-semibold btn-hover"
                  to="/login"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Inline CSS styles for button effects */}
      <style jsx="true">{`
        .btn-hover {
          transition: background-color 0.3s ease, color 0.3s ease,
            box-shadow 0.3s ease;
          cursor: pointer;
        }
        .btn-hover:hover {
          background-color: #ffa500; /* bright orange */
          color: #0a192f !important;
          box-shadow: 0 4px 12px rgba(255, 165, 0, 0.6);
          text-decoration: none;
        }
        .btn-cart {
          background-color: #ffb347;
          color: #0a192f !important;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .btn-cart:hover {
          background-color: #ffa500;
          color: #0a192f !important;
          text-decoration: none;
          box-shadow: 0 4px 8px rgba(255, 165, 0, 0.7);
        }
        .admin-btn {
          background: linear-gradient(45deg, #004aad, #0066ff);
          color: white !important;
          font-weight: 700;
          box-shadow: 0 0 10px rgba(0, 102, 255, 0.8);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .admin-btn:hover {
          background: linear-gradient(45deg, #003a82, #0051cc);
          box-shadow: 0 0 20px rgba(0, 81, 204, 1);
          color: #fff !important;
          text-decoration: none;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
