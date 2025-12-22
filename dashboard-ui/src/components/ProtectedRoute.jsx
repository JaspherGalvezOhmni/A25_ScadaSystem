import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{padding: '2rem'}}>Loading authentication...</div>;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (adminOnly && user?.role !== 'Admin') {
    return <Navigate to="/" replace />; // Not an admin, send to home
  }

  return children;
}
export default ProtectedRoute;