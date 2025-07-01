// App.js
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminRoute from "./components/AdminRoute"; // Admin Route wrapper

// Pages (lazy loaded for performance)
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Cart = lazy(() => import("./pages/Cart"));
const Order = lazy(() => import("./pages/Order"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const Checkout = lazy(() => import("./pages/CheckOut"));
const PaymentReceipt = lazy(() => import("./pages/PaymentReceipt"));

// App Component
function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState([]);

  // Load auth and cart from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const adminStatus = localStorage.getItem("isAdmin") === "true";

    setIsAuthenticated(!!token);
    setIsAdmin(adminStatus);

    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
  }, []);

  // Save cart to localStorage on update
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Login handler
  const handleLogin = () => {
    localStorage.setItem("isAdmin", localStorage.getItem("isAdmin"));
    setIsAuthenticated(true);
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAdmin");
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/login", { replace: true });
  };

  // Show loader initially
  if (isAuthenticated === null) return <Loader />;

  return (
    <>
      {/* Always show Navbar and Footer */}
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

            {/* Authenticated User Routes */}
            {isAuthenticated && (
              <>
                <Route path="/order" element={<Order />} />
                <Route path="/myOrders" element={<OrderPage />} />
              </>
            )}

            {/* Admin Route */}
            {isAuthenticated && isAdmin && (
              <Route
                path="/admin"
                element={<AdminRoute element={<AdminDashboard />} />}
              />
            )}

            {/* Catch-All */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </>
  );
}

export default App;
