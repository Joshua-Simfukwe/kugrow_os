import { useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/context/useAuth";

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

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
          ▣
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
            Powered by Kugrow OS
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {organizationName}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {roleLabel} • {organizationType}
          </p>

          {(title || subtitle) && (
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-medium text-slate-700">{title}</span>
              {subtitle ? ` • ${subtitle}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="
            rounded-xl bg-slate-900
            px-4 py-2 text-sm text-white
            transition hover:opacity-90
          "
        >
          {user?.profile?.full_name?.split(" ")[0] ?? "Logout"}
        </button>
      </div>
    </header>
  );
}
