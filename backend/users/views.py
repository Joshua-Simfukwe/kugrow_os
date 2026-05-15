from common.access import require_module_access, require_team_management
from common.organization import get_active_organization
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes
from rest_framework.decorators import permission_classes
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Branch, OrganizationMembership
from .serializers import (
    AuthResponseSerializer,
    BranchSerializer,
    JoinOrganizationSerializer,
    LoginSerializer,
    OnboardingUserSerializer,
    OrganizationCreateSerializer,
    OrganizationMemberCreateSerializer,
    OrganizationMemberSerializer,
    OrganizationMemberUpdateSerializer,
    OrganizationMembershipSerializer,
    OrganizationSelectionSerializer,
    OrganizationSerializer,
    SignupSerializer,
    build_auth_response,
)


@api_view(["POST"])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        response_serializer = AuthResponseSerializer(build_auth_response(user))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        response_serializer = AuthResponseSerializer(build_auth_response(user))
        return Response(response_serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    request.user.auth_token.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = OnboardingUserSerializer(request.user)
    return Response(serializer.data)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def organization_list(request):
    memberships = OrganizationMembership.objects.filter(user=request.user).select_related(
        "organization"
    )
    serializer = OrganizationMembershipSerializer(memberships, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_organization(request):
    serializer = OrganizationCreateSerializer(
        data=request.data,
        context={"request": request},
    )
    if serializer.is_valid():
        organization = serializer.save()
        response_serializer = OrganizationSerializer(organization)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def select_organization(request):
    serializer = OrganizationSelectionSerializer(
        data=request.data,
        context={"request": request},
    )
    if serializer.is_valid():
        organization = serializer.save()
        response_serializer = OrganizationSerializer(organization)
        return Response(response_serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def join_organization(request):
    serializer = JoinOrganizationSerializer(
        data=request.data,
        context={"request": request},
    )
    if serializer.is_valid():
        membership = serializer.save()
        response_serializer = OrganizationMembershipSerializer(membership)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def branch_list(request):
    require_module_access(request, "home")
    organization = get_active_organization(request)

    branches = Branch.objects.filter(
        organization=organization,
        is_active=True,
    ).order_by("name")
    serializer = BranchSerializer(branches, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def organization_team(request):
    membership = require_team_management(request)
    organization = membership.organization

    if request.method == "GET":
        members = OrganizationMembership.objects.filter(
            organization=organization
        ).select_related("user__profile", "organization")
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)

    serializer = OrganizationMemberCreateSerializer(
        data=request.data,
        context={"request": request, "organization": organization},
    )
    if serializer.is_valid():
        member = serializer.save()
        return Response(
            OrganizationMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def organization_team_member_detail(request, membership_id):
    acting_membership = require_team_management(request)
    organization = acting_membership.organization

    try:
        membership = OrganizationMembership.objects.select_related(
            "user__profile",
            "organization",
        ).get(pk=membership_id, organization=organization)
    except OrganizationMembership.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if membership.role == OrganizationMembership.Role.OWNER:
        return Response(
            {"detail": "Owner access cannot be modified from this screen."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = OrganizationMemberUpdateSerializer(data=request.data, partial=True)
    if serializer.is_valid():
        serializer.update(membership, serializer.validated_data)
        return Response(OrganizationMemberSerializer(membership).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
