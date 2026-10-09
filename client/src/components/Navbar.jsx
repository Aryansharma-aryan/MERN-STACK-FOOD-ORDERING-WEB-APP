import { useState } from "react";
import { Link } from "react-router-dom";
import { hasSession } from "../utils/cart";
import logo from "../assets/logo.jpeg";
export default function Navbar({ cart = [], handleLogout, isAdmin }) {
  const [open, setOpen] = useState(false);
  const authenticated = hasSession();
  return <nav className="navbar navbar-expand-lg navbar-dark px-3 py-2" style={{ background: "#0A192F" }}>
    <Link className="navbar-brand fw-bold text-warning" to="/home"><img src={logo} alt="" width="50" className="me-2" />Food Mania</Link>
    <button className="navbar-toggler" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}><span className="navbar-toggler-icon" /></button>
    <div className={`collapse navbar-collapse ${open ? "show" : ""}`}>
      <div className="navbar-nav ms-auto gap-3 align-items-lg-center" onClick={() => setOpen(false)}>
        <Link className="nav-link" to="/home">Menu</Link>
        <Link className="nav-link text-warning" to="/cart">Cart ({cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0)})</Link>
        {authenticated && <Link className="nav-link" to="/myOrders">My Orders</Link>}
        {isAdmin && <Link className="nav-link" to="/admin">Admin Dashboard</Link>}
        {authenticated ? <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button> : <Link className="nav-link" to="/login">Login</Link>}
      </div>
    </div>
  </nav>;
}
