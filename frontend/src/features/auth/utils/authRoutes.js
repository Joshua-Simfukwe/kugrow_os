export function getHomeRoute(user) {
  if (!user) {
    return "/login";
  }

  if (!user.organizations?.length) {
    return "/create-organization";
  }

  if (!user.profile?.active_organization) {
    return "/organizations";
  }

  return "/dashboard";
}

export function getPostLoginRoute(user) {
  if (!user.organizations?.length) {
    return "/create-organization";
  }

  return "/organizations";
}
