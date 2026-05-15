from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Branch, Organization, OrganizationMembership, UserProfile

User = get_user_model()


class OnboardingApiTests(APITestCase):
    def create_organization_with_owner(self, user, name="Test Organization", organization_type=Organization.OrganizationType.RETAIL):
        organization = Organization.objects.create(
            name=name,
            organization_type=organization_type,
            created_by=user,
        )
        Branch.objects.create(
            organization=organization,
            name="Main Branch",
            code=f"MAIN-{organization.id}",
            is_main=True,
            created_by=user,
        )
        OrganizationMembership.objects.create(
            user=user,
            organization=organization,
            role=OrganizationMembership.Role.OWNER,
        )
        return organization

    def create_user_with_profile(self, email, full_name="Test User"):
        user = User.objects.create_user(
            email=email,
            password="strongpass123",
        )
        user.profile.full_name = full_name
        user.profile.save(update_fields=["full_name", "updated_at"])
        return user

    def authenticate(self, user):
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": user.email,
                "password": "strongpass123",
            },
            format="json",
        )
        token = response.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        return token

    def test_signup_creates_user_and_profile(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "full_name": "Jane Doe",
                "email": "jane@example.com",
                "password": "strongpass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["email"], "jane@example.com")
        self.assertEqual(response.data["user"]["profile"]["full_name"], "Jane Doe")
        self.assertEqual(response.data["user"]["organizations"], [])

        user = User.objects.get(email="jane@example.com")
        self.assertTrue(user.check_password("strongpass123"))
        self.assertEqual(user.profile.full_name, "Jane Doe")
        self.assertTrue(user.auth_token.key)

    def test_signup_rejects_duplicate_email(self):
        User.objects.create_user(
            email="jane@example.com",
            password="strongpass123",
        )

        response = self.client.post(
            "/api/auth/signup/",
            {
                "full_name": "Jane Doe",
                "email": "jane@example.com",
                "password": "anotherpass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_returns_user_and_organizations(self):
        user = self.create_user_with_profile("jane@example.com", "Jane Doe")
        organization = self.create_organization_with_owner(user, name="Kugrow Enterprises")

        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "jane@example.com",
                "password": "strongpass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["email"], "jane@example.com")
        self.assertEqual(len(response.data["user"]["organizations"]), 1)
        self.assertEqual(response.data["user"]["organizations"][0]["name"], "Kugrow Enterprises")

    def test_login_rotates_existing_token(self):
        user = self.create_user_with_profile("rotate@example.com", "Rotate User")
        first_response = self.client.post(
            "/api/auth/login/",
            {
                "email": user.email,
                "password": "strongpass123",
            },
            format="json",
        )

        second_response = self.client.post(
            "/api/auth/login/",
            {
                "email": user.email,
                "password": "strongpass123",
            },
            format="json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(first_response.data["token"], second_response.data["token"])

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_user(self):
        user = self.create_user_with_profile("owner@example.com", "Owner User")
        token = self.authenticate(user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "owner@example.com")
        self.assertEqual(response.data["profile"]["full_name"], "Owner User")
        self.assertTrue(token)

    def test_create_organization_assigns_owner_membership(self):
        user = self.create_user_with_profile("owner@example.com", "Owner User")
        self.authenticate(user)

        response = self.client.post(
            "/api/auth/organizations/create/",
            {
                "name": "Future Academy",
                "organization_type": "education",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        organization = Organization.objects.get(name="Future Academy")
        membership = OrganizationMembership.objects.get(user=user, organization=organization)

        self.assertEqual(membership.role, OrganizationMembership.Role.OWNER)
        user.profile.refresh_from_db()
        self.assertEqual(user.profile.active_organization, organization)

    def test_list_organizations_returns_user_memberships(self):
        user = self.create_user_with_profile("owner@example.com", "Owner User")
        organization = self.create_organization_with_owner(user, name="Kugrow Enterprises")
        self.authenticate(user)

        response = self.client.get("/api/auth/organizations/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Kugrow Enterprises")
        self.assertEqual(response.data[0]["role"], OrganizationMembership.Role.OWNER)
        self.assertTrue(response.data[0]["join_code"])

    def test_select_organization_sets_active_organization(self):
        user = self.create_user_with_profile("owner@example.com", "Owner User")
        self.authenticate(user)
        first_organization = self.create_organization_with_owner(user, name="Kugrow Enterprises")
        second_organization = self.create_organization_with_owner(
            user,
            name="Future Academy",
            organization_type=Organization.OrganizationType.EDUCATION,
        )

        response = self.client.post(
            "/api/auth/organizations/select/",
            {
                "organization_id": second_organization.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.profile.refresh_from_db()
        self.assertEqual(user.profile.active_organization, second_organization)

    def test_select_organization_rejects_user_without_membership(self):
        user = self.create_user_with_profile("owner@example.com", "Owner User")
        outsider = self.create_user_with_profile("outsider@example.com", "Outsider")
        organization = self.create_organization_with_owner(user, name="Kugrow Enterprises")
        self.authenticate(outsider)

        response = self.client.post(
            "/api/auth/organizations/select/",
            {
                "organization_id": organization.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("organization_id", response.data)

    def test_create_organization_creates_profile_if_missing(self):
        user = User.objects.create_user(
            email="noprof@example.com",
            password="strongpass123",
        )
        self.authenticate(user)

        response = self.client.post(
            "/api/auth/organizations/create/",
            {
                "name": "No Profile Org",
                "organization_type": "retail",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user.refresh_from_db()
        self.assertTrue(hasattr(user, "profile"))
        self.assertEqual(user.profile.full_name, "noprof@example.com")

    def test_logout_revokes_current_token(self):
        user = self.create_user_with_profile("logout@example.com", "Logout User")
        token = self.authenticate(user)

        response = self.client.post("/api/auth/logout/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        me_response = self.client.get("/api/auth/me/")
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_organization_creates_member_membership(self):
        owner = self.create_user_with_profile("owner@example.com", "Owner User")
        organization = self.create_organization_with_owner(owner, name="Kugrow Store")

        member = self.create_user_with_profile("member@example.com", "Member User")
        self.authenticate(member)

        response = self.client.post(
            "/api/auth/organizations/join/",
            {
                "join_code": organization.join_code,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        membership = OrganizationMembership.objects.get(user=member, organization=organization)
        self.assertEqual(membership.role, OrganizationMembership.Role.MEMBER)
        member.profile.refresh_from_db()
        self.assertEqual(member.profile.active_organization, organization)

    def test_join_organization_rejects_unknown_code(self):
        member = self.create_user_with_profile("member@example.com", "Member User")
        self.authenticate(member)

        response = self.client.post(
            "/api/auth/organizations/join/",
            {
                "join_code": "BADCODE1",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("join_code", response.data)

    def test_me_returns_active_membership_details(self):
        owner = self.create_user_with_profile("owner@example.com", "Owner User")
        organization = self.create_organization_with_owner(owner, name="Kugrow Retail")
        owner.profile.active_organization = organization
        owner.profile.active_branch = organization.main_branch
        owner.profile.save(update_fields=["active_organization", "active_branch", "updated_at"])
        self.authenticate(owner)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_membership"]["organization_name"], "Kugrow Retail")
        self.assertIn("inventory", response.data["active_membership"]["module_access"])

    def test_team_endpoint_creates_member_with_module_access(self):
        owner = self.create_user_with_profile("owner@example.com", "Owner User")
        organization = self.create_organization_with_owner(owner, name="Kugrow Store")
        owner.profile.active_organization = organization
        owner.profile.active_branch = organization.main_branch
        owner.profile.save(update_fields=["active_organization", "active_branch", "updated_at"])
        self.authenticate(owner)

        response = self.client.post(
            "/api/auth/team/",
            {
                "full_name": "Cashier User",
                "email": "cashier@example.com",
                "password": "strongpass123",
                "role": "member",
                "module_access": ["home", "pos"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        membership = OrganizationMembership.objects.get(
            user__email="cashier@example.com",
            organization=organization,
        )
        self.assertEqual(membership.role, OrganizationMembership.Role.MEMBER)
        self.assertEqual(membership.module_access, ["home", "pos"])

    def test_team_endpoint_rejects_non_admin_membership(self):
        owner = self.create_user_with_profile("owner@example.com", "Owner User")
        organization = self.create_organization_with_owner(owner, name="Kugrow Store")
        member = self.create_user_with_profile("member@example.com", "Member User")
        OrganizationMembership.objects.create(
            user=member,
            organization=organization,
            role=OrganizationMembership.Role.MEMBER,
        )
        member.profile.active_organization = organization
        member.profile.active_branch = organization.main_branch
        member.profile.save(update_fields=["active_organization", "active_branch", "updated_at"])
        self.authenticate(member)

        response = self.client.get("/api/auth/team/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
