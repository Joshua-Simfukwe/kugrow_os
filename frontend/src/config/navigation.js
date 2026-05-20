import { hasModuleAccess } from "../features/auth/utils/authRoutes";

const retailNavigationItems = [
  {
    name: "Home",
    path: "/home",
    module: "home",
    icon: "storefront",
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    module: "dashboard",
    icon: "apartment",
  },
  {
    name: "POS",
    path: "/pos",
    module: "pos",
    icon: "storefront",
  },
  {
    name: "Inventory",
    path: "/inventory",
    module: "inventory",
    icon: "apartment",
  },
  {
    name: "Settings",
    path: "/settings",
    module: "settings",
    icon: "settings",
  },
];

const educationNavigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    module: "dashboard",
    icon: "apartment",
  },
  {
    name: "Pupils",
    icon: "school",
    disabled: true,
  },
  {
    name: "Grades & Classes",
    icon: "groups",
    disabled: true,
  },
  {
    name: "Staff",
    icon: "groups",
    disabled: true,
  },
  {
    name: "Fees & Receipts",
    icon: "schedule",
    disabled: true,
  },
  {
    name: "Payment History",
    icon: "schedule",
    disabled: true,
  },
  {
    name: "Other Sales",
    icon: "storefront",
    disabled: true,
  },
  {
    name: "Expenses",
    icon: "apartment",
    disabled: true,
  },
  {
    name: "Reports",
    icon: "apartment",
    disabled: true,
  },
  {
    name: "Unpaid Balances",
    icon: "apartment",
    disabled: true,
  },
  {
    name: "School Settings",
    path: "/settings",
    module: "settings",
    icon: "settings",
  },
  {
    name: "Users and Roles",
    path: "/settings",
    module: "settings",
    icon: "groups",
  },
];

export function getNavigationItems(user) {
  const organizationType = user?.active_membership?.organization_type;
  const source =
    organizationType === "education"
      ? educationNavigationItems
      : retailNavigationItems;

  return source.filter((item) => {
    if (item.disabled) {
      return true;
    }

    if (!item.module) {
      return true;
    }

    return hasModuleAccess(user, item.module);
  });
}
