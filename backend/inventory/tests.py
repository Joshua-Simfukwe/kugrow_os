from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from users.models import Branch, Organization, OrganizationMembership

from .models import Category, Product

User = get_user_model()


class InventoryApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="inventory@example.com", password="strongpass123")
        self.user.profile.full_name = "Inventory Manager"
        self.user.profile.save(update_fields=["full_name", "updated_at"])
        self.organization = Organization.objects.create(
            name="Kugrow Store",
            organization_type=Organization.OrganizationType.RETAIL,
            created_by=self.user,
        )
        self.branch = Branch.objects.create(
            organization=self.organization,
            name="Main Branch",
            code="MAIN",
            is_main=True,
            created_by=self.user,
        )
        OrganizationMembership.objects.create(
            user=self.user,
            organization=self.organization,
            role=OrganizationMembership.Role.OWNER,
        )
        self.user.profile.active_organization = self.organization
        self.user.profile.active_branch = self.branch
        self.user.profile.save(update_fields=["active_organization", "active_branch", "updated_at"])
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.category = Category.objects.create(organization=self.organization, name="Mealie Meal")
        self.product = Product.objects.create(
            organization=self.organization,
            name="Breakfast Meal",
            sku="BM-001",
            category=self.category,
            selling_price=150,
            cost_price=100,
            current_stock=0,
            reorder_level=5,
        )

    def test_inventory_adjustment_adds_stock_to_branch(self):
        response = self.client.post(
            "/api/inventory/adjustments/",
            {
                "product_id": self.product.id,
                "transaction_type": "IN",
                "quantity": 10,
                "reference": "Restock",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.current_stock, 10)
        self.assertEqual(self.product.branch_stocks.get(branch=self.branch).current_stock, 10)

    def test_inventory_transactions_list_returns_recent_activity(self):
        self.client.post(
            "/api/inventory/adjustments/",
            {
                "product_id": self.product.id,
                "transaction_type": "IN",
                "quantity": 8,
                "reference": "Restock",
            },
            format="json",
        )

        response = self.client.get("/api/inventory/transactions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["product_name"], "Breakfast Meal")

    def test_product_list_allows_pos_only_member_access(self):
        membership = OrganizationMembership.objects.get(
            user=self.user,
            organization=self.organization,
        )
        membership.role = OrganizationMembership.Role.MEMBER
        membership.module_access = ["home", "pos"]
        membership.save(update_fields=["role", "module_access"])

        response = self.client.get("/api/inventory/products/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
