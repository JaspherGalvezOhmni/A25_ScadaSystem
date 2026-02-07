// dashboard-ui/src/components/ProtectedRoute.jsx
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // 1. If AuthContext says it's loading, show loading screen.
  if (isLoading) {
    // Show a more friendly message now that you removed the original loading screen
    return <div style={{padding: '2rem'}}>Verifying session or loading user details...</div>;
  }

  // 2. If loading is false, but we still have no token (unauthenticated flow completed)
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. CRITICAL FINAL GUARD: If we have a token, loading is false, but role is missing.
  // This means re-validation FAILED on the network (e.g. 401, server down, etc.) 
  // and the final state is bad. If we can't get the role, we should force a log out.
  if (!user || !user.role) {
    console.warn("ProtectedRoute: Token found but user/role missing. Forcing logout.");
    // We should log out here to clear the bad token and redirect to login/App.jsx redirect logic.
    // This is the only safe exit from the bad state.
    // NOTE: This relies on AuthContext's `logout` redirecting.
    const { logout } = useAuth(); 
    logout(); 
    return <div style={{padding: '2rem'}}>Session verification failed. Redirecting to login...</div>;
  }
  
  // 4. Role-based restriction
  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/" replace />; 
  }

  return children;
}
export default ProtectedRoute;