import hashlib
import secrets
import string
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from .managers import UserManager


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Organization(models.Model):
    class OrganizationType(models.TextChoices):
        RETAIL = "retail", "Retail"
        EDUCATION = "education", "Education"

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True)
    join_code = models.CharField(max_length=12, unique=True, editable=False)
    organization_type = models.CharField(
        max_length=20,
        choices=OrganizationType.choices,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_organizations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @staticmethod
    def generate_join_code(length=8):
        alphabet = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            suffix = 1

            while Organization.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                suffix += 1
                slug = f"{base_slug}-{suffix}"

            self.slug = slug

        if not self.join_code:
            join_code = self.generate_join_code()
            while Organization.objects.filter(join_code=join_code).exclude(pk=self.pk).exists():
                join_code = self.generate_join_code()
            self.join_code = join_code

        super().save(*args, **kwargs)

    @property
    def main_branch(self):
        return self.branches.filter(is_main=True, is_active=True).first()


class Branch(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="branches",
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20)
    is_main = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_branches",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("organization", "code")

    def __str__(self):
        return f"{self.organization.name} - {self.name}"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=30, blank=True)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    active_organization = models.ForeignKey(
        "Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_members",
    )
    active_branch = models.ForeignKey(
        "Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

    def get_masked_phone_number(self):
        digits = "".join(character for character in self.phone_number if character.isdigit())
        if len(digits) >= 2:
            return f"**{digits[-2:]}"
        return ""


class OrganizationMembership(models.Model):
    MODULE_HOME = "home"
    MODULE_DASHBOARD = "dashboard"
    MODULE_POS = "pos"
    MODULE_INVENTORY = "inventory"
    MODULE_SETTINGS = "settings"
    MODULE_USERS = "users"
    AVAILABLE_MODULES = [
        MODULE_HOME,
        MODULE_DASHBOARD,
        MODULE_POS,
        MODULE_INVENTORY,
        MODULE_SETTINGS,
        MODULE_USERS,
    ]

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
    )
    module_access = models.JSONField(default=list, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "organization")
        ordering = ["organization__name"]

    def __str__(self):
        return f"{self.user.email} -> {self.organization.name}"

    @classmethod
    def default_module_access_for_role(cls, role):
        if role == cls.Role.OWNER:
            return list(cls.AVAILABLE_MODULES)
        if role == cls.Role.ADMIN:
            return [
                cls.MODULE_HOME,
                cls.MODULE_DASHBOARD,
                cls.MODULE_POS,
                cls.MODULE_INVENTORY,
                cls.MODULE_SETTINGS,
                cls.MODULE_USERS,
            ]
        return [
            cls.MODULE_HOME,
            cls.MODULE_DASHBOARD,
            cls.MODULE_POS,
        ]

    def get_resolved_module_access(self):
        if self.role == self.Role.OWNER:
            return list(self.AVAILABLE_MODULES)

        configured_modules = self.module_access or self.default_module_access_for_role(
            self.role
        )
        valid_modules = [
            module_key
            for module_key in configured_modules
            if module_key in self.AVAILABLE_MODULES
        ]
        return valid_modules or self.default_module_access_for_role(self.role)


class PhoneVerificationChallenge(models.Model):
    CODE_LENGTH = 6
    DEFAULT_EXPIRY_SECONDS = 5 * 60
    MAX_ATTEMPTS = 5

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="phone_verification_challenges",
    )
    phone_number = models.CharField(max_length=30, blank=True)
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    attempt_count = models.PositiveSmallIntegerField(default=0)
    resend_count = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Phone challenge for {self.user.email}"

    @staticmethod
    def generate_code(length=CODE_LENGTH):
        return "".join(secrets.choice(string.digits) for _ in range(length))

    @staticmethod
    def hash_code(code):
        return hashlib.sha256(code.encode("utf-8")).hexdigest()

    @classmethod
    def issue_for_user(cls, user, phone_number="", code=None):
        cls.objects.filter(user=user, verified_at__isnull=True).delete()
        challenge = cls(user=user, phone_number=phone_number or "")
        challenge.refresh_code(code=code)
        challenge.save()
        return challenge

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def expires_in_seconds(self):
        remaining = int((self.expires_at - timezone.now()).total_seconds())
        return max(remaining, 0)

    def refresh_code(self, code=None):
        plaintext_code = code or self.generate_code()
        now = timezone.now()
        self.code_hash = self.hash_code(plaintext_code)
        self.expires_at = now + timedelta(seconds=self.DEFAULT_EXPIRY_SECONDS)
        self.last_sent_at = now
        self.verified_at = None
        if self.pk:
            self.resend_count += 1
        self._plaintext_code = plaintext_code
        return plaintext_code

    def verify_code(self, submitted_code):
        if self.verified_at is not None or self.is_expired:
            return False
        if self.attempt_count >= self.MAX_ATTEMPTS:
            return False

        self.attempt_count += 1
        matches = secrets.compare_digest(
            self.code_hash,
            self.hash_code(submitted_code),
        )
        if matches:
            self.verified_at = timezone.now()
        self.save(update_fields=["attempt_count", "verified_at", "updated_at"])
        return matches
