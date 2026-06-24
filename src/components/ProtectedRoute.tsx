import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const isAuthenticated =
    localStorage.getItem("token") !== null;

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
}