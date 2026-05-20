import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth/context/useAuth";
import { getNavigationItems } from "../../config/navigation";
import MaterialSymbol from "./MaterialSymbol";

function getRoleLabel(role) {
  if (!role) {
    return "Member";
  }
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export default function AppSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}) {
  const location = useLocation();
  const { user } = useAuth();
  const navigationItems = getNavigationItems(user);
  const roleLabel = getRoleLabel(user?.active_membership?.role);
  const organizationName =
    user?.profile?.active_organization?.name ?? "Workspace";
  const organizationType =
    user?.active_membership?.organization_type ?? "retail";
  const isEducation = organizationType === "education";
  const organizationInitial = organizationName.charAt(0).toUpperCase() || "K";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-[18rem]
        border-r border-slate-200/90 bg-white/96
        transition-transform duration-300
        md:static md:translate-x-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="flex h-full flex-col px-4 py-5">
        <div className="rounded-[1.8rem] border border-slate-200/90 bg-gradient-to-br from-[#f7fbff] to-[#eef4ff] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.3rem] text-white shadow-[0_14px_28px_rgba(21,87,247,0.18)] ${
                isEducation
                  ? "bg-gradient-to-br from-[#1F6BFF] to-[#1557F7]"
                  : "bg-gradient-to-br from-slate-900 to-slate-700"
              }`}
            >
              {isEducation ? (
                <MaterialSymbol name="school" className="text-[1.8rem]" />
              ) : (
                <MaterialSymbol name="storefront" className="text-[1.8rem]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-blue-600">
                {isEducation ? "School Workspace" : "Business Workspace"}
              </p>
              <p className="mt-1 truncate text-[1.1rem] font-bold tracking-tight text-slate-950">
                {organizationName}
              </p>
              <p className="mt-1 text-sm text-slate-500">{roleLabel} access</p>
            </div>
          </div>
        </div>

        <Link
          to="/organizations"
          onClick={() => setMobileMenuOpen(false)}
          className="mt-4 flex items-center gap-3 rounded-[1.25rem] border border-slate-200/90 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-blue-200 hover:bg-slate-50 hover:text-slate-950"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-slate-100 text-blue-600">
            <MaterialSymbol name="arrow_forward" className="rotate-180 text-[1.35rem]" />
          </span>
          <span className="min-w-0 flex-1 truncate">Back to organizations</span>
        </Link>

        <nav className="mt-5 space-y-1.5">
          {navigationItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            const itemContent = (
              <>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ${
                    isActive
                      ? "bg-white/18 text-white"
                      : item.disabled
                        ? "bg-slate-100 text-slate-400"
                        : "bg-slate-100 text-blue-600"
                  }`}
                >
                  <MaterialSymbol name={item.icon ?? "arrow_forward"} className="text-[1.35rem]" />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {item.disabled ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Soon
                  </span>
                ) : null}
              </>
            );

            if (item.disabled || !item.path) {
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-[1.25rem] px-3 py-2.5 text-sm font-semibold text-slate-500"
                >
                  {itemContent}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 rounded-[1.25rem] px-3 py-2.5
                  text-sm font-semibold transition
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#1F6BFF] to-[#1557F7] text-white shadow-[0_16px_32px_rgba(21,87,247,0.24)]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }
                `}
              >
                {itemContent}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[1.5rem] border border-slate-200/90 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {organizationInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.profile?.full_name ?? "Workspace user"}
              </p>
              <p className="text-xs text-slate-500">Powered by Kugrow OS</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
