import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";
import { readCart, mergeCarts, hasSession } from "./utils/cart";
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Cart = lazy(() => import("./pages/Cart"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const Checkout = lazy(() => import("./pages/CheckOut"));
const PaymentReceipt = lazy(() => import("./pages/PaymentReceipt"));

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setAuthenticated] = useState(hasSession);
  const [isAdmin, setAdmin] = useState(() => hasSession() && localStorage.getItem("isAdmin") === "true");
  const [cartKey, setCartKey] = useState(() => hasSession() ? `cart_${localStorage.getItem("userId")}` : "cart_guest");
  const [cart, setCart] = useState(() => readCart(hasSession() ? `cart_${localStorage.getItem("userId")}` : "cart_guest"));
  useEffect(() => { localStorage.setItem(cartKey, JSON.stringify(cart)); }, [cart, cartKey]);
  const handleLogin = () => {
    const key = `cart_${localStorage.getItem("userId")}`;
    const merged = mergeCarts(readCart(key), cartKey === "cart_guest" ? cart : []);
    localStorage.removeItem("cart_guest");
    setCartKey(key);
    setCart(merged);
    setAuthenticated(true);
    setAdmin(localStorage.getItem("isAdmin") === "true");
  };
  const handleLogout = () => {
    ["authToken", "userId", "isAdmin", "userRole"].forEach(key => localStorage.removeItem(key));
    setAuthenticated(false);
    setAdmin(false);
    setCartKey("cart_guest");
    setCart(readCart("cart_guest"));
    navigate("/home", { replace: true });
  };
  const protect = element => <PrivateRoute isAuthenticated={isAuthenticated}>{element}</PrivateRoute>;
  return <>
    <Navbar cart={cart} handleLogout={handleLogout} isAdmin={isAdmin} />
    <main><Suspense fallback={<Loader />}><Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home cart={cart} setCart={setCart} />} />
      <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
      <Route path="/login" element={<Login handleLogin={handleLogin} />} />
      <Route path="/signup" element={<Signup handleLogin={handleLogin} />} />
      <Route path="/checkout" element={protect(<Checkout cart={cart} setCart={setCart} />)} />
      <Route path="/receipt/:orderId" element={protect(<PaymentReceipt />)} />
      <Route path="/payment/:paymentId" element={protect(<PaymentReceipt />)} />
      <Route path="/order" element={<Navigate to="/myOrders" replace />} />
      <Route path="/myOrders" element={protect(<OrderPage />)} />
      <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes></Suspense></main><Footer />
  </>;
}
