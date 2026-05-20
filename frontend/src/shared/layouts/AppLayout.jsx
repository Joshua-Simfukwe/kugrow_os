import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../features/auth/context/useAuth";
import AppSidebar from "../components/AppSidebar";
import MaterialSymbol from "../components/MaterialSymbol";

export default function AppLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const organizationName =
    user?.profile?.active_organization?.name ?? "Workspace";
  const isEducation =
    user?.active_membership?.organization_type === "education";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#e9f1ff_100%)]">
      <div className="flex min-h-screen">
        <AppSidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/88 px-4 py-4 backdrop-blur-[10px] md:hidden">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-blue-600">
                {isEducation ? "School Workspace" : "Business Workspace"}
              </p>
              <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                {organizationName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/organizations"
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-blue-600 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                aria-label="Back to organizations"
              >
                <MaterialSymbol name="arrow_forward" className="rotate-180 text-[1.35rem]" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                aria-label="Open menu"
              >
                <span className="text-sm font-semibold">Menu</span>
              </button>
            </div>
          </div>

          <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
