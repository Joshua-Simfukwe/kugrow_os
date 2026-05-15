from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes
from rest_framework.decorators import permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import OrganizationMembership
from .serializers import (
    AuthResponseSerializer,
    LoginSerializer,
    OnboardingUserSerializer,
    OrganizationCreateSerializer,
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
    organizations = [membership.organization for membership in memberships]
    serializer = OrganizationSerializer(organizations, many=True)
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
