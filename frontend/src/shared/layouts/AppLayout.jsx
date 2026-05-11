import { Link, useLocation } from "react-router-dom";

export default function AppLayout({ children }) {
  const location = useLocation();

  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "POS",
      path: "/pos",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
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
                  className={`
                    block rounded-xl px-4 py-3 text-sm font-medium transition
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

        {/* Main Content */}
        <main className="min-h-screen flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}