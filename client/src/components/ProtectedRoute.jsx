import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Wraps a route that requires authentication.
 *  - While auth state is loading (token being verified) → renders nothing (avoids flash)
 *  - Authenticated → renders children
 *  - Guest → opens the login modal and redirects to / (or `redirectTo` prop)
 *
 * Usage:
 *   <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, authLoading, openAuthModal } = useAuth();
  const location = useLocation();

  // When a guest hits a protected route, open the login modal so they
  // can authenticate without losing their intended destination context.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal('login');
    }
  }, [authLoading, isAuthenticated, openAuthModal]);

  // Still verifying the stored token — render nothing to avoid flash
  if (authLoading) return null;

  // Authenticated — render the page
  if (isAuthenticated) return children;

  // Guest — redirect and the useEffect above triggers the modal
  return <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default ProtectedRoute;
