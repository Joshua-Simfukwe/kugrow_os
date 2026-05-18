from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from inventory.models import Category, Product
from sales.models import Sale
from users.models import Branch, Organization, OrganizationMembership

from .models import Expense, ExpenseCategory

User = get_user_model()


class FinanceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="owner@example.com", password="strongpass123")
        self.user.profile.full_name = "Owner"
        self.user.profile.save(update_fields=["full_name", "updated_at"])
        self.organization = Organization.objects.create(
            name="Retail HQ",
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

    def test_dashboard_summary_returns_retail_metrics(self):
        category = Category.objects.create(organization=self.organization, name="Mealie Meal")
        Product.objects.create(
            organization=self.organization,
            name="Breakfast Meal",
            sku="BM-001",
            category=category,
            selling_price=150,
            cost_price=100,
            current_stock=2,
            reorder_level=5,
        )
        expense_category = ExpenseCategory.objects.create(organization=self.organization, name="Fuel")
        Expense.objects.create(
            organization=self.organization,
            branch=self.branch,
            category=expense_category,
            title="Delivery Fuel",
            amount=200,
            payment_method="CASH",
            incurred_on=date.today(),
            created_by=self.user,
        )
        Sale.objects.create(
            organization=self.organization,
            branch=self.branch,
            receipt_number="RCPT-001",
            payment_method="CASH",
            total_amount=500,
            amount_paid=300,
            balance_due=200,
            payment_status=Sale.PaymentStatus.PARTIAL,
            created_by=self.user,
            is_paid=False,
        )

        response = self.client.get("/api/finance/dashboard/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["organization_type"], "retail")
        self.assertEqual(len(response.data["headline_metrics"]), 4)

    def test_dashboard_summary_allows_home_only_access(self):
        membership = OrganizationMembership.objects.get(
            user=self.user,
            organization=self.organization,
        )
        membership.role = OrganizationMembership.Role.MEMBER
        membership.module_access = ["home", "pos"]
        membership.save(update_fields=["role", "module_access"])

        response = self.client.get("/api/finance/dashboard/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
