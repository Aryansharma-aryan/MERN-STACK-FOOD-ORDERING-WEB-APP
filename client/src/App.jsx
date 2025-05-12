import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import "./App.css";

// Lazy load pages to improve performance
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Cart = lazy(() => import("./pages/Cart"));
const Order = lazy(() => import("./pages/Order"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
import Checkout from "./pages/CheckOut";
import PaymentReceipt from "./pages/PaymentReceipt";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminRoute from "./components/AdminRoute"; // Import AdminRoute

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState([]);

  // Load authentication status & cart from localStorage
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAuthenticated(!!token);
    setIsAdmin(adminStatus);
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
  }, []);

  // Save cart to localStorage whenever it updates
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Login function
  const handleLogin = () => {
    localStorage.setItem("isAdmin", localStorage.getItem("isAdmin")); // redundant but safe fallback
    setIsAuthenticated(true);
    setIsAdmin(localStorage.getItem("isAdmin") === "true"); // ✅ Reads from localStorage
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAdmin");
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/login", { replace: true });
  };

  // Show loader while checking authentication
  if (isAuthenticated === null) return <Loader />;

  return (
    <>
      {isAuthenticated && (
        <Navbar cart={cart} handleLogout={handleLogout} isAdmin={isAdmin} />
      )}

      <main>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
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

            {/* Private Routes */}
            {isAuthenticated ? (
              <>
                <Route path="/" element={<Navigate to="/home" />} />

                {/* Admin Route (Protected) */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute
                      element={<AdminDashboard />}
                    />
                  }
                />

                {/* User Routes */}
                <Route path="/home" element={<Home cart={cart} setCart={setCart} />} />
                <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
                <Route path="/order" element={<Order />} />
                <Route path="/myOrders" element={<OrderPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/:paymentId" element={<PaymentReceipt />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Suspense>
      </main>

      {isAuthenticated && <Footer />}
    </>
  );
}

export default App;
