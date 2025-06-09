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
        {/* Logo */}
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

        {/* Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          style={{ filter: "invert(1)" }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu */}
        <div
          className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 gap-lg-0 flex-column flex-lg-row text-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-light btn-hover" to="/">
                    Home
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link text-light btn-hover" to="/myOrders">
                    My Orders
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link text-warning fw-bold btn-cart" to="/cart">
                    🛒 Cart <span className="badge bg-light text-dark">{cart.length}</span>
                  </Link>
                </li>

                {isAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link fw-bold admin-btn" to="/admin">
                      Admin Dashboard
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <button
                    className="btn btn-danger fw-semibold btn-hover"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-primary fw-semibold btn-hover" to="/login">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Styles */}
      <style jsx="true">{`
        .btn-hover {
          transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }

        .btn-hover:hover {
          background-color: #ffa500;
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

        @media (max-width: 991px) {
          .navbar-nav {
            background-color: #0a192f;
            padding: 1rem;
            border-radius: 10px;
            width: 100%;
          }

          .navbar-nav .nav-item {
            width: 100%;
            margin-bottom: 10px;
          }

          .navbar-nav .nav-link,
          .navbar-nav .btn {
            width: 100%;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
