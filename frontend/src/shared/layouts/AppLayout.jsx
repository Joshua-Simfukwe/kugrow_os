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
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-600">
            Powered by Kugrow OS
          </p>
          <h1 className="text-lg font-bold text-gray-900">
            {user?.profile?.active_organization?.name ?? "Workspace"}
          </h1>
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
        <main className="min-h-screen flex-1 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
