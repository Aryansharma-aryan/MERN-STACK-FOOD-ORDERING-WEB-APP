import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ element }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('authToken'); // also check token

  if (!token || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

export default AdminRoute;
