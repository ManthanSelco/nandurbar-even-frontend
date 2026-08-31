import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStaff } from "../lib/auth";

type ProtectedRouteProps = {
  allowedRoles?: string[];
};

export function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  const token = sessionStorage.getItem("pj_token");
  const staff = getStaff();

  // Not logged in
  if (!token) {
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(
          location.pathname
        )}`}
        replace
      />
    );
  }

  // Logged in but role is not allowed
  if (
    allowedRoles &&
    !allowedRoles.includes(staff?.role)
  ) {
    return (
      <Navigate
        to="/admin/participants"
        replace
      />
    );
  }

  return <Outlet />;
}