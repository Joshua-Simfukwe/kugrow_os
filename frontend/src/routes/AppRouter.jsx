import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import SignupPage from "../features/auth/pages/SignupPage";
import OrganizationSelectPage from "../features/auth/pages/OrganizationSelectPage";
import CreateOrganizationPage from "../features/auth/pages/CreateOrganizationPage";
import JoinOrganizationPage from "../features/auth/pages/JoinOrganizationPage";

import Dashboard from "../pages/Dashboard";
import AppLayout from "../shared/layouts/AppLayout";
import Inventory from "../pages/Inventory";
import POS from "../pages/POS";
import RetailHome from "../pages/RetailHome";
import Settings from "../pages/Settings";
import {
  AuthenticatedRoute,
  GuestOnlyRoute,
  ModuleRoute,
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
        <Route element={<ModuleRoute moduleKey="home" />}>
          <Route
            path="/home"
            element={
              <AppLayout>
                <RetailHome />
              </AppLayout>
            }
          />
        </Route>
        <Route element={<ModuleRoute moduleKey="dashboard" />}>
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
        </Route>
        <Route element={<ModuleRoute moduleKey="pos" />}>
          <Route
            path="/pos"
            element={
              <AppLayout>
                <POS />
              </AppLayout>
            }
          />
        </Route>
        <Route element={<ModuleRoute moduleKey="inventory" />}>
          <Route
            path="/inventory"
            element={
              <AppLayout>
                <Inventory />
              </AppLayout>
            }
          />
        </Route>
        <Route element={<ModuleRoute moduleKey="settings" />}>
          <Route
            path="/settings"
            element={
              <AppLayout>
                <Settings />
              </AppLayout>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
