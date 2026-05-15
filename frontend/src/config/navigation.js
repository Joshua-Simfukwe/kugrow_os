import { hasModuleAccess } from "../features/auth/utils/authRoutes";

const allNavigationItems = [
  {
    name: "Home",
    path: "/home",
    module: "home",
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    module: "dashboard",
  },
  {
    name: "POS",
    path: "/pos",
    module: "pos",
  },
  {
    name: "Inventory",
    path: "/inventory",
    module: "inventory",
  },
  {
    name: "Settings",
    path: "/settings",
    module: "settings",
  },
];

export function getNavigationItems(user) {
  const organizationType = user?.active_membership?.organization_type;

  return allNavigationItems.filter((item) => {
    if (!hasModuleAccess(user, item.module)) {
      return false;
    }

    if (organizationType === "education") {
      return !["home", "inventory", "pos"].includes(item.module);
    }

    return true;
  });
}
