import { useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/context/useAuth";
import MaterialSymbol from "./MaterialSymbol";

function getWorkspaceIcon(organizationType) {
  return organizationType === "education" ? "school" : "storefront";
}

export default function AppHeader({
  title,
  subtitle,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const organizationName =
    user?.profile?.active_organization?.name ?? "Workspace";
  const organizationType =
    user?.profile?.active_organization?.organization_type ?? "workspace";
  const roleLabel = user?.active_membership?.role ?? "member";
  const firstName = user?.profile?.full_name?.split(" ")[0] ?? "Logout";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-[1.8rem] border border-white/80 bg-white/78 px-5 py-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] backdrop-blur-[8px] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-blue-50 text-blue-600">
          <MaterialSymbol name={getWorkspaceIcon(organizationType)} className="text-[1.9rem]" />
        </div>

        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-600">
            Powered by Kugrow OS
          </p>

          <h1 className="mt-1 text-[1.8rem] font-bold tracking-tight text-slate-950">
            {organizationName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {roleLabel} • {organizationType}
          </p>

          {(title || subtitle) && (
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{title}</span>
              {subtitle ? ` • ${subtitle}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {firstName}
        </button>
      </div>
    </header>
  );
}
