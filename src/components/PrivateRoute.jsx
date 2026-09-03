import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

/**
 * Gate for signed-in routes.
 *
 * The location being protected is passed along so the login page can return
 * the user to where they were headed. Without it, someone sent to sign in from
 * checkout landed on the home page afterwards and had to start over.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader fullHeight text="Checking your session…" />;

  return user
    ? children
    : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
