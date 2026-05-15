from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers

from .models import Branch, Organization, OrganizationMembership, UserProfile

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    branch_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "organization_type",
            "join_code",
            "branch_count",
            "created_at",
        ]

    def get_branch_count(self, obj):
        return obj.branches.filter(is_active=True).count()


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
            "module_access",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["module_access"] = instance.get_resolved_module_access()
        return representation


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

    class Meta:
        model = UserProfile
        fields = ["full_name", "active_organization", "active_branch"]


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
