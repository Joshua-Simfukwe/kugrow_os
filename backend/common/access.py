from rest_framework.exceptions import PermissionDenied, ValidationError

from users.models import OrganizationMembership


def get_active_membership(user, organization=None):
    profile = getattr(user, "profile", None)
    active_organization = organization or getattr(profile, "active_organization", None)
    if active_organization is None:
        raise ValidationError(
            {"organization": "Select an organization before accessing this resource."}
        )

    try:
        return OrganizationMembership.objects.select_related("organization", "user").get(
            user=user,
            organization=active_organization,
        )
    except OrganizationMembership.DoesNotExist as exc:
        raise PermissionDenied("You do not belong to the active organization.") from exc


def get_allowed_modules(membership):
    return membership.get_resolved_module_access()


def require_module_access(request, module_key):
    membership = get_active_membership(request.user)
    allowed_modules = get_allowed_modules(membership)
    if module_key not in allowed_modules:
        raise PermissionDenied(
            "You do not have access to this workspace module in the active organization."
        )
    return membership


def require_any_module_access(request, module_keys):
    membership = get_active_membership(request.user)
    allowed_modules = set(get_allowed_modules(membership))
    if not allowed_modules.intersection(module_keys):
        raise PermissionDenied(
            "You do not have access to this workspace module in the active organization."
        )
    return membership


def require_team_management(request):
    membership = get_active_membership(request.user)
    if membership.role == OrganizationMembership.Role.OWNER:
        return membership

    allowed_modules = get_allowed_modules(membership)
    if membership.role == OrganizationMembership.Role.ADMIN and (
        "users" in allowed_modules or "settings" in allowed_modules
    ):
        return membership

    raise PermissionDenied("You do not have permission to manage organization users.")
