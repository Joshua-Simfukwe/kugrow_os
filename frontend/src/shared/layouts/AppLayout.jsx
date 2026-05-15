import { useState } from "react";

import { useAuth } from "../../features/auth/context/useAuth";
import AppSidebar from "../components/AppSidebar";

export default function AppLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Topbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:hidden">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Kugrow OS
          </h1>
          <p className="text-xs text-gray-500">
            {user?.profile?.active_organization?.name ?? "Workspace"}
          </p>
        </div>

        <button
          onClick={() =>
            setMobileMenuOpen(!mobileMenuOpen)
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          Menu
        </button>
      </div>

      <div className="flex">
        <AppSidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />
        )}

        {/* Main Content */}
        <main className="min-h-screen flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
