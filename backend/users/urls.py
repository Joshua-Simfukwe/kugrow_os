from django.urls import path

from .views import (
    create_organization,
    join_organization,
    login,
    logout,
    me,
    organization_list,
    select_organization,
    signup,
)

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("logout/", logout),
    path("me/", me),
    path("organizations/", organization_list),
    path("organizations/create/", create_organization),
    path("organizations/join/", join_organization),
    path("organizations/select/", select_organization),
]
