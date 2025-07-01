import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminRoute from "./components/AdminRoute"; // Admin wrapper for /admin

// Pages (Lazy loading for performance)
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Cart = lazy(() => import("./pages/Cart"));
const Order = lazy(() => import("./pages/Order"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const Checkout = lazy(() => import("./pages/CheckOut"));
const PaymentReceipt = lazy(() => import("./pages/PaymentReceipt"));

function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState([]);

  // Load auth and cart on app load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    const userId = localStorage.getItem("userId");

    setIsAuthenticated(!!token);
    setIsAdmin(adminStatus);

    if (userId) {
      try {
        const savedCart = JSON.parse(localStorage.getItem(`cart_${userId}`) || "[]");
        setCart(Array.isArray(savedCart) ? savedCart : []);
      } catch (err) {
        console.error("Failed to load cart:", err);
        setCart([]);
      }
    }
  }, []);

  // Save user-specific cart to localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    }
  }, [cart]);

  const handleLogin = () => {
    const isAdminNow = localStorage.getItem("isAdmin") === "true";
    setIsAuthenticated(true);
    setIsAdmin(isAdminNow);

    const userId = localStorage.getItem("userId");
    if (userId) {
      const savedCart = JSON.parse(localStorage.getItem(`cart_${userId}`) || "[]");
      setCart(Array.isArray(savedCart) ? savedCart : []);
    }
  };

  const handleLogout = () => {
    const userId = localStorage.getItem("userId");

    // Optionally, remove cart too
    if (userId) {
      localStorage.removeItem(`cart_${userId}`);
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("isAdmin");

    setIsAuthenticated(false);
    setIsAdmin(false);
    setCart([]);
    navigate("/login", { replace: true });
  };

  if (isAuthenticated === null) return <Loader />;

  return (
    <>
      <Navbar cart={cart} handleLogout={handleLogout} isAdmin={isAdmin} />

      <main>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login handleLogin={handleLogin} />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />
            <Route path="/home" element={<Home cart={cart} setCart={setCart} />} />
            <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/:paymentId" element={<PaymentReceipt />} />

            {/* Optional: Protect Orders with auth */}
            <Route path="/order" element={<Order />} />
            <Route path="/myOrders" element={<OrderPage />} />

            {/* Admin Panel (Protected Route) */}
            {isAuthenticated && isAdmin && (
              <Route
                path="/admin"
                element={<AdminRoute element={<AdminDashboard />} />}
              />
            )}

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </>
  );
}

export default App;
