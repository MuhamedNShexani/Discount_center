import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedEmails = null }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // log in, which is a nicer user experience than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedEmails is specified, check if user's email is in the allowed list
  if (allowedEmails && !allowedEmails.includes(user.email)) {
    // Redirect to home page if user doesn't have access
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
