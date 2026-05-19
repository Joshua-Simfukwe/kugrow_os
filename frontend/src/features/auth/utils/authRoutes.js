const WORKSPACE_ROUTE_BY_MODULE = {
  home: "/home",
  dashboard: "/dashboard",
  pos: "/pos",
  inventory: "/inventory",
  settings: "/settings",
  users: "/settings",
};

export function hasModuleAccess(user, moduleKey) {
  if (
    user?.active_membership?.organization_type === "education" &&
    ["home", "inventory", "pos"].includes(moduleKey)
  ) {
    return false;
  }

  const allowedModules = user?.active_membership?.module_access ?? [];
  if (moduleKey === "settings" && allowedModules.includes("users")) {
    return true;
  }
  return allowedModules.includes(moduleKey);
}

export function getWorkspaceRoute(user) {
  if (user?.active_membership?.organization_type === "education") {
    return "/dashboard";
  }

  const allowedModules = user?.active_membership?.module_access ?? [];
  for (const moduleKey of allowedModules) {
    const route = WORKSPACE_ROUTE_BY_MODULE[moduleKey];
    if (route) {
      return route;
    }
  }
  return "/home";
}

export function getHomeRoute() {
  return "/organizations";
}

export function getPostLoginRoute() {
  return "/organizations";
}
