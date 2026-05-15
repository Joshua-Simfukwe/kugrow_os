import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import SignupPage from "../features/auth/pages/SignupPage";
import OrganizationSelectPage from "../features/auth/pages/OrganizationSelectPage";
import CreateOrganizationPage from "../features/auth/pages/CreateOrganizationPage";
import JoinOrganizationPage from "../features/auth/pages/JoinOrganizationPage";

import Dashboard from "../pages/Dashboard";
import AppLayout from "../shared/layouts/AppLayout";
import POS from "../pages/POS";
import {
  AuthenticatedRoute,
  GuestOnlyRoute,
  RootRedirect,
  WorkspaceRoute,
} from "./RouteGuards";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<AuthenticatedRoute />}>
        <Route path="/organizations" element={<OrganizationSelectPage />} />
        <Route
          path="/create-organization"
          element={<CreateOrganizationPage />}
        />
        <Route
          path="/join-organization"
          element={<JoinOrganizationPage />}
        />
      </Route>

      <Route element={<WorkspaceRoute />}>
        <Route
          path="/pos"
          element={
            <AppLayout>
              <POS />
            </AppLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
