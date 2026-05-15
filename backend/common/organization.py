from rest_framework.exceptions import ValidationError

from users.models import Branch


def get_active_organization(request):
    profile = getattr(request.user, "profile", None)
    organization = getattr(profile, "active_organization", None)
    if organization is None:
        raise ValidationError(
            {"organization": "Select an organization before accessing this resource."}
        )
    return organization


def get_active_branch(request, organization=None):
    profile = getattr(request.user, "profile", None)
    active_organization = organization or get_active_organization(request)
    requested_branch_id = request.headers.get("X-Branch-Id") or request.query_params.get(
        "branch_id"
    )
    if requested_branch_id is None and hasattr(request, "data"):
        requested_branch_id = request.data.get("branch_id")

    if requested_branch_id:
        try:
            branch = Branch.objects.get(
                pk=requested_branch_id,
                organization=active_organization,
                is_active=True,
            )
        except Branch.DoesNotExist as exc:
            raise ValidationError(
                {"branch_id": "Branch not found in the active organization."}
            ) from exc

        if profile and profile.active_branch_id != branch.id:
            profile.active_branch = branch
            profile.save(update_fields=["active_branch", "updated_at"])
        return branch

    active_branch = getattr(profile, "active_branch", None)
    if active_branch and active_branch.organization_id == active_organization.id:
        return active_branch

    branch = (
        active_organization.branches.filter(is_active=True, is_main=True).first()
        or active_organization.branches.filter(is_active=True).order_by("name").first()
    )
    if branch is None:
        raise ValidationError(
            {"branch": "No active branch exists for the selected organization."}
        )

    if profile and profile.active_branch_id != branch.id:
        profile.active_branch = branch
        profile.save(update_fields=["active_branch", "updated_at"])

    return branch
