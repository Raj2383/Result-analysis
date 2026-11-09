import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';

// Guards faculty/admin-only pages (Upload, Admin). Result/Toppers/Analytics stay public.
export default function ProtectedRoute({ children, allowedRoles = ['faculty', 'admin'] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p className="p-8 text-center">Checking session…</p>;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
