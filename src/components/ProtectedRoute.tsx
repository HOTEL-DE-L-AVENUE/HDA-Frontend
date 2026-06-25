import { Navigate, Outlet } from "react-router-dom";
import AuthService from "../services/AuthService";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const isAuthenticated = AuthService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Vérification optionnelle des rôles
  if (allowedRoles && !AuthService.hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />; // ou une page "accès interdit"
  }

  return <Outlet />;
};

export default ProtectedRoute;