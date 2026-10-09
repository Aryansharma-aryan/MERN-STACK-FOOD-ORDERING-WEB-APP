import { Navigate, useLocation } from "react-router-dom";
import { hasSession } from "../utils/cart";

const PrivateRoute = ({ isAuthenticated, children }) => {
  const location = useLocation();
  if (!isAuthenticated || !hasSession()) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return children;
};

export default PrivateRoute;
