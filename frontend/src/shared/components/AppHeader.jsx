import { useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/context/useAuth";

export default function AppHeader({
  title,
  subtitle,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="
            rounded-xl border border-gray-300
            bg-white px-4 py-2 text-sm
            transition hover:bg-gray-50
          "
        >
          {user?.profile?.active_organization?.name ?? "Workspace"}
        </button>

        <button
          onClick={handleLogout}
          className="
            rounded-xl bg-black
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
