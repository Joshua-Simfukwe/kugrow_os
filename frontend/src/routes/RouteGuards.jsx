import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth/context/useAuth";
import { getHomeRoute, hasModuleAccess } from "../features/auth/utils/authRoutes";

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
        Loading workspace...
      </div>
    </div>
  );
}

export function GuestOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <Outlet />;
}

export function AuthenticatedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function WorkspaceRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.organizations?.length) {
    return <Navigate to="/create-organization" replace />;
  }

  if (!user.profile?.active_organization) {
    return <Navigate to="/organizations" replace />;
  }

  return <Outlet />;
}

export function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRoute(user)} replace />;
}

export function ModuleRoute({ moduleKey }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasModuleAccess(user, moduleKey)) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <Outlet />;
}
