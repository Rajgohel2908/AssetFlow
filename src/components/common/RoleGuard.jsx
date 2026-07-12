import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../utils/access';

export default function RoleGuard({ routeKey, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(routeKey, user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
