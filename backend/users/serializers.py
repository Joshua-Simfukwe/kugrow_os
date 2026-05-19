from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers

from .models import (
    Branch,
    Organization,
    OrganizationMembership,
    PhoneVerificationChallenge,
    UserProfile,
)

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    branch_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "organization_type",
            "join_code",
            "branch_count",
            "member_count",
            "created_at",
        ]

    def get_branch_count(self, obj):
        return obj.branches.filter(is_active=True).count()

    def get_member_count(self, obj):
        return obj.memberships.count()


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "code", "is_main", "is_active"]


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
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "name",
            "slug",
            "organization_type",
            "join_code",
            "created_at",
            "member_count",
            "role",
            "module_access",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["module_access"] = instance.get_resolved_module_access()
        return representation

    def get_member_count(self, obj):
        return obj.organization.memberships.count()


class ActiveMembershipSerializer(serializers.ModelSerializer):
    organization_id = serializers.IntegerField(source="organization.id", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    organization_type = serializers.CharField(
        source="organization.organization_type",
        read_only=True,
    )

    class Meta:
        model = OrganizationMembership
        fields = [
            "organization_id",
            "organization_name",
            "organization_type",
            "role",
            "module_access",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["module_access"] = instance.get_resolved_module_access()
        return representation


class UserProfileSerializer(serializers.ModelSerializer):
    active_organization = OrganizationSerializer(read_only=True)
    active_branch = BranchSerializer(read_only=True)
    masked_phone_number = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "full_name",
            "phone_number",
            "phone_verified_at",
            "masked_phone_number",
            "active_organization",
            "active_branch",
        ]

    def get_masked_phone_number(self, obj):
        return obj.get_masked_phone_number()


class OnboardingUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    organizations = serializers.SerializerMethodField()
    active_membership = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "profile", "organizations", "active_membership"]

    def get_profile(self, obj):
        profile, _ = UserProfile.objects.get_or_create(
            user=obj,
            defaults={"full_name": obj.get_full_name() or obj.email},
        )
        return UserProfileSerializer(profile).data

    def get_organizations(self, obj):
        memberships = obj.organization_memberships.select_related("organization")
        return OrganizationMembershipSerializer(memberships, many=True).data

    def get_active_membership(self, obj):
        active_organization = getattr(obj.profile, "active_organization", None)
        if active_organization is None:
            return None

        membership = (
            obj.organization_memberships.select_related("organization")
            .filter(organization=active_organization)
            .first()
        )
        if membership is None:
            return None
        return ActiveMembershipSerializer(membership).data


class AuthResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = OnboardingUserSerializer()


class PhoneVerificationChallengeSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    full_name = serializers.CharField()
    masked_phone_number = serializers.CharField(allow_blank=True)
    expires_in_seconds = serializers.IntegerField()
    can_use_another_phone_number = serializers.BooleanField(default=True)
    debug_code = serializers.CharField(required=False)


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


class VerifyPhoneCodeSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(min_length=6, max_length=6)

    default_error_messages = {
        "invalid_code": "That code is not valid. Please try again.",
        "expired": "That code has expired. Request a new one and try again.",
        "attempts_exceeded": "Too many incorrect attempts. Request a new code to continue.",
        "not_found": "We could not find that verification request. Start again from login.",
    }

    def validate_code(self, value):
        normalized_value = value.strip()
        if not normalized_value.isdigit():
            raise serializers.ValidationError("Enter the 6-digit verification code.")
        return normalized_value

    def validate(self, attrs):
        challenge_id = attrs["challenge_id"]
        try:
            challenge = PhoneVerificationChallenge.objects.select_related("user", "user__profile").get(
                pk=challenge_id
            )
        except PhoneVerificationChallenge.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"challenge_id": self.error_messages["not_found"]}
            ) from exc

        if challenge.verified_at is not None:
            raise serializers.ValidationError(
                {"challenge_id": self.error_messages["not_found"]}
            )
        if challenge.is_expired:
            raise serializers.ValidationError({"code": self.error_messages["expired"]})
        if challenge.attempt_count >= PhoneVerificationChallenge.MAX_ATTEMPTS:
            raise serializers.ValidationError(
                {"code": self.error_messages["attempts_exceeded"]}
            )

        attrs["challenge"] = challenge
        return attrs

    def create(self, validated_data):
        challenge = validated_data["challenge"]
        if not challenge.verify_code(validated_data["code"]):
            raise serializers.ValidationError({"code": self.error_messages["invalid_code"]})

        profile = challenge.user.profile
        if challenge.phone_number and profile.phone_number != challenge.phone_number:
            profile.phone_number = challenge.phone_number
        profile.phone_verified_at = timezone.now()
        profile.save(update_fields=["phone_number", "phone_verified_at", "updated_at"])
        return challenge.user


class ResendPhoneCodeSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()

    default_error_messages = {
        "not_found": "We could not find that verification request. Start again from login.",
    }

    def validate(self, attrs):
        challenge_id = attrs["challenge_id"]
        try:
            challenge = PhoneVerificationChallenge.objects.select_related("user", "user__profile").get(
                pk=challenge_id
            )
        except PhoneVerificationChallenge.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"challenge_id": self.error_messages["not_found"]}
            ) from exc

        if challenge.verified_at is not None:
            raise serializers.ValidationError(
                {"challenge_id": self.error_messages["not_found"]}
            )

        attrs["challenge"] = challenge
        return attrs

    def save(self, **kwargs):
        challenge = self.validated_data["challenge"]
        challenge.refresh_code()
        challenge.save(update_fields=["code_hash", "expires_at", "last_sent_at", "resend_count", "verified_at", "updated_at"])
        return challenge


class OrganizationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    organization_type = serializers.ChoiceField(
        choices=Organization.OrganizationType.choices
    )
    main_branch_name = serializers.CharField(max_length=150, required=False)

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
        branch_name = validated_data.get("main_branch_name", "Main Branch").strip() or "Main Branch"
        main_branch = Branch.objects.create(
            organization=organization,
            name=branch_name,
            code="MAIN",
            is_main=True,
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
        profile.active_branch = main_branch
        profile.save(update_fields=["active_organization", "active_branch", "updated_at"])

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
        profile.active_branch = organization.main_branch
        profile.save(update_fields=["active_organization", "active_branch", "updated_at"])

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
        profile.active_branch = organization.main_branch
        profile.save(update_fields=["active_organization", "active_branch", "updated_at"])

        return membership


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.profile.full_name", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "user_id",
            "email",
            "full_name",
            "role",
            "module_access",
            "joined_at",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["module_access"] = instance.get_resolved_module_access()
        return representation


class OrganizationMemberCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(required=False, write_only=True, trim_whitespace=False)
    role = serializers.ChoiceField(
        choices=[
            OrganizationMembership.Role.ADMIN,
            OrganizationMembership.Role.MEMBER,
        ]
    )
    module_access = serializers.ListField(
        child=serializers.ChoiceField(choices=OrganizationMembership.AVAILABLE_MODULES),
        required=False,
    )

    def validate_email(self, value):
        return value.strip().lower()

    def validate_module_access(self, value):
        return list(dict.fromkeys(value))

    def validate(self, attrs):
        organization = self.context["organization"]
        email = attrs["email"]
        password = attrs.get("password")
        requested_modules = attrs.get("module_access")
        user = User.objects.filter(email__iexact=email).first()

        if user is None and not password:
            raise serializers.ValidationError(
                {"password": "Password is required when creating a brand new user."}
            )

        if user and OrganizationMembership.objects.filter(
            user=user,
            organization=organization,
        ).exists():
            raise serializers.ValidationError(
                {"email": "That user already belongs to this organization."}
            )

        if password:
            validate_password(password, user=User(email=email))

        attrs["existing_user"] = user
        if requested_modules:
            attrs["module_access"] = requested_modules
        else:
            attrs["module_access"] = OrganizationMembership.default_module_access_for_role(
                attrs["role"]
            )
        return attrs

    def create(self, validated_data):
        organization = self.context["organization"]
        existing_user = validated_data.pop("existing_user", None)
        password = validated_data.pop("password", None)
        full_name = validated_data.pop("full_name").strip()
        email = validated_data.pop("email")

        if existing_user is None:
            user = User.objects.create_user(email=email, password=password)
        else:
            user = existing_user

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"full_name": full_name or user.email},
        )
        if full_name:
            profile.full_name = full_name
            profile.save(update_fields=["full_name", "updated_at"])

        membership = OrganizationMembership.objects.create(
            user=user,
            organization=organization,
            **validated_data,
        )
        return membership


class OrganizationMemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[
            OrganizationMembership.Role.ADMIN,
            OrganizationMembership.Role.MEMBER,
        ],
        required=False,
    )
    module_access = serializers.ListField(
        child=serializers.ChoiceField(choices=OrganizationMembership.AVAILABLE_MODULES),
        required=False,
    )

    def validate_module_access(self, value):
        return list(dict.fromkeys(value))

    def update(self, instance, validated_data):
        if "role" in validated_data:
            instance.role = validated_data["role"]

        if "module_access" in validated_data:
            instance.module_access = validated_data["module_access"]
        elif not instance.module_access:
            instance.module_access = OrganizationMembership.default_module_access_for_role(
                instance.role
            )

        instance.save(update_fields=["role", "module_access"])
        return instance


def build_auth_response(user):
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return {
        "token": token.key,
        "user": user,
    }


def build_phone_verification_response(challenge):
    payload = {
        "challenge_id": challenge.id,
        "full_name": challenge.user.profile.full_name,
        "masked_phone_number": challenge.user.profile.get_masked_phone_number(),
        "expires_in_seconds": challenge.expires_in_seconds,
        "can_use_another_phone_number": True,
    }
    if settings.DEBUG:
        payload["debug_code"] = getattr(challenge, "_plaintext_code", "")
    return payload
