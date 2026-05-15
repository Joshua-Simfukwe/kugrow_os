from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers

from .models import Organization, OrganizationMembership, UserProfile

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "organization_type",
            "join_code",
            "created_at",
        ]


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="organization.id", read_only=True)
    name = serializers.CharField(source="organization.name", read_only=True)
    slug = serializers.CharField(source="organization.slug", read_only=True)
    organization_type = serializers.CharField(
        source="organization.organization_type",
        read_only=True,
    )
    join_code = serializers.CharField(source="organization.join_code", read_only=True)
    created_at = serializers.DateTimeField(source="organization.created_at", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "name",
            "slug",
            "organization_type",
            "join_code",
            "created_at",
            "role",
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    active_organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ["full_name", "active_organization"]


class OnboardingUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    organizations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "profile", "organizations"]

    def get_profile(self, obj):
        profile, _ = UserProfile.objects.get_or_create(
            user=obj,
            defaults={"full_name": obj.get_full_name() or obj.email},
        )
        return UserProfileSerializer(profile).data

    def get_organizations(self, obj):
        memberships = obj.organization_memberships.select_related("organization")
        return OrganizationMembershipSerializer(memberships, many=True).data


class AuthResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = OnboardingUserSerializer()


class SignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        normalized_email = value.strip().lower()

        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("An account with this email already exists.")

        return normalized_email

    def validate_password(self, value):
        user = User(email=self.initial_data.get("email", "").strip().lower())
        validate_password(value, user=user)
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        full_name = validated_data["full_name"].strip()

        user = User.objects.create_user(
            email=email,
            password=password,
        )
        profile = user.profile
        profile.full_name = full_name
        profile.save(update_fields=["full_name", "updated_at"])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password,
        )
        if not user:
            raise AuthenticationFailed("Invalid email or password.")
        if not user.is_active:
            raise AuthenticationFailed("This account is inactive.")

        attrs["user"] = user
        return attrs


class OrganizationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    organization_type = serializers.ChoiceField(
        choices=Organization.OrganizationType.choices
    )

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Organization name is required.")
        return name

    def create(self, validated_data):
        user = self.context["request"].user
        organization = Organization.objects.create(
            name=validated_data["name"],
            organization_type=validated_data["organization_type"],
            created_by=user,
        )
        OrganizationMembership.objects.create(
            user=user,
            organization=organization,
            role=OrganizationMembership.Role.OWNER,
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"full_name": user.get_full_name() or user.email},
        )
        profile.active_organization = organization
        profile.save(update_fields=["active_organization", "updated_at"])

        return organization


class OrganizationSelectionSerializer(serializers.Serializer):
    organization_id = serializers.IntegerField()

    def validate(self, attrs):
        user = self.context["request"].user
        organization_id = attrs["organization_id"]

        try:
            organization = Organization.objects.get(pk=organization_id)
        except Organization.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"organization_id": "Organization not found."}
            ) from exc

        membership_exists = OrganizationMembership.objects.filter(
            user=user,
            organization=organization,
        ).exists()
        if not membership_exists:
            raise serializers.ValidationError(
                {"organization_id": "This user does not belong to that organization."}
            )

        attrs["user"] = user
        attrs["organization"] = organization
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        organization = self.validated_data["organization"]

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"full_name": user.get_full_name() or user.email},
        )
        profile.active_organization = organization
        profile.save(update_fields=["active_organization", "updated_at"])

        return organization


class JoinOrganizationSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=12)

    def validate_join_code(self, value):
        return value.strip().upper()

    def create(self, validated_data):
        user = self.context["request"].user
        join_code = validated_data["join_code"]

        try:
            organization = Organization.objects.get(join_code=join_code)
        except Organization.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"join_code": "Organization not found for that join code."}
            ) from exc

        membership, _ = OrganizationMembership.objects.get_or_create(
            user=user,
            organization=organization,
            defaults={"role": OrganizationMembership.Role.MEMBER},
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"full_name": user.get_full_name() or user.email},
        )
        profile.active_organization = organization
        profile.save(update_fields=["active_organization", "updated_at"])

        return membership


def build_auth_response(user):
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return {
        "token": token.key,
        "user": user,
    }
