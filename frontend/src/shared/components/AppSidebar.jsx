import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/useAuth";
import { getNavigationItems } from "../../config/navigation";

export default function AppSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}) {
  const location = useLocation();
  const { user } = useAuth();
  const navigationItems = getNavigationItems(user);
  const roleLabel = user?.active_membership?.role ?? "member";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64
        border-r border-gray-200 bg-white
        transition-transform duration-300

        md:static md:translate-x-0

        ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
      `}
    >
      <div className="border-b border-gray-200 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
          Powered by Kugrow OS
        </p>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {user?.profile?.active_organization?.name ?? "Business Workspace"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {roleLabel} access
        </p>
      </div>

      <nav className="space-y-2 p-4">
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className={`
                block rounded-xl px-4 py-3
                text-sm font-medium transition

                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
