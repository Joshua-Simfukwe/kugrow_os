from django.urls import path

from .views import (
    branch_list,
    create_organization,
    join_organization,
    login,
    logout,
    me,
    organization_list,
    organization_team,
    organization_team_member_detail,
    select_organization,
    signup,
    resend_phone_code,
    verify_phone_code,
)

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("phone-verification/verify/", verify_phone_code),
    path("phone-verification/resend/", resend_phone_code),
    path("logout/", logout),
    path("me/", me),
    path("organizations/", organization_list),
    path("organizations/create/", create_organization),
    path("organizations/join/", join_organization),
    path("organizations/select/", select_organization),
    path("branches/", branch_list),
    path("team/", organization_team),
    path("team/<int:membership_id>/", organization_team_member_detail),
]
