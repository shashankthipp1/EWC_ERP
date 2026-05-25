import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { APP_NAME } from "../constants/branding";

export function ProtectedRoute() {
  const { isCheckingSession, token } = useAuth();
  if (isCheckingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-mesh">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-muted">{APP_NAME}</p>
        </div>
      </div>
    );
  }
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
