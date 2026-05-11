import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import SignupPage from "../features/auth/pages/SignupPage";
import OrganizationSelectPage from "../features/auth/pages/OrganizationSelectPage";
import CreateOrganizationPage from "../features/auth/pages/CreateOrganizationPage";

import Dashboard from "../pages/Dashboard";
import AppLayout from "../shared/layouts/AppLayout";
import POS from "../pages/POS";

export default function AppRouter() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Organizations */}
      <Route
        path="/organizations"
        element={<OrganizationSelectPage />}
      />

      <Route
        path="/create-organization"
        element={<CreateOrganizationPage />}
      />

      {/* POS */}
      <Route
        path="/pos"
        element={
          <AppLayout>
            <POS />
          </AppLayout>
        }
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}