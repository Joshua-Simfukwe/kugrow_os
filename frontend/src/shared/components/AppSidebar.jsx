import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "../../config/navigation";

export default function AppSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}) {
  const location = useLocation();

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
        <h1 className="text-2xl font-bold text-gray-900">
          Kugrow OS
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Business Workspace
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
                    ? "bg-black text-white"
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