from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from users.models import Branch, Organization, OrganizationMembership

from .models import FeeInvoice, SchoolClass, Student

User = get_user_model()


class EducationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="school@example.com", password="strongpass123")
        self.user.profile.full_name = "School Admin"
        self.user.profile.save(update_fields=["full_name", "updated_at"])
        self.organization = Organization.objects.create(
            name="Future Academy",
            organization_type=Organization.OrganizationType.EDUCATION,
            created_by=self.user,
        )
        self.branch = Branch.objects.create(
            organization=self.organization,
            name="Main Campus",
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

    def test_school_fee_payment_updates_invoice_balance(self):
        school_class = SchoolClass.objects.create(organization=self.organization, name="Grade 1")
        student = Student.objects.create(
            organization=self.organization,
            school_class=school_class,
            admission_number="FA-001",
            first_name="Lydia",
            last_name="Banda",
        )
        invoice = FeeInvoice.objects.create(
            organization=self.organization,
            student=student,
            term_label="Term 1",
            amount_due=1500,
            amount_paid=0,
            balance_due=1500,
            created_by=self.user,
        )

        response = self.client.post(
            "/api/education/fee-payments/",
            {
                "invoice_id": invoice.id,
                "amount": "500.00",
                "payment_method": "CASH",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        invoice.refresh_from_db()
        self.assertEqual(str(invoice.amount_paid), "500.00")
        self.assertEqual(str(invoice.balance_due), "1000.00")
        self.assertEqual(invoice.status, FeeInvoice.Status.PARTIAL)
