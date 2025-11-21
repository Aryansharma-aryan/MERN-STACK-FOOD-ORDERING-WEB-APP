import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ element }) => {
  const token = localStorage.getItem("authToken");
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!token || !isAdmin) {
    // Redirect non-admin users or unauthenticated users to login
    return <Navigate to="/login" replace />;
  }

  // If admin and logged in, render the component
  return element;
};

export default AdminRoute;
