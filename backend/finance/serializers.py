from django.db import models
from django.db.models import Sum
from rest_framework import serializers

from common.organization import get_active_branch, get_active_organization
from education.models import FeeInvoice, FeePayment, SchoolClass, Student
from inventory.models import Product
from sales.models import Sale, SaleItem

from .models import Expense, ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "description", "is_active"]


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "category",
            "category_name",
            "branch",
            "branch_name",
            "title",
            "description",
            "amount",
            "payment_method",
            "incurred_on",
            "reference",
        ]


class ExpenseCreateSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    title = serializers.CharField(max_length=150)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Expense.PAYMENT_METHODS)
    incurred_on = serializers.DateField()
    reference = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def create(self, validated_data):
        request = self.context["request"]
        organization = get_active_organization(request)
        branch = get_active_branch(request, organization)
        try:
            category = ExpenseCategory.objects.get(
                pk=validated_data.pop("category_id"),
                organization=organization,
            )
        except ExpenseCategory.DoesNotExist as exc:
            raise serializers.ValidationError({"category_id": "Expense category not found."}) from exc

        return Expense.objects.create(
            organization=organization,
            branch=branch,
            category=category,
            created_by=request.user,
            **validated_data,
        )


class DashboardSummarySerializer(serializers.Serializer):
    organization_type = serializers.CharField()
    headline_metrics = serializers.ListField()
    charts = serializers.ListField()
    tables = serializers.ListField()


def build_dashboard_summary(organization):
    if organization.organization_type == organization.OrganizationType.EDUCATION:
        total_students = Student.objects.filter(organization=organization, is_active=True).count()
        total_classes = SchoolClass.objects.filter(organization=organization, is_active=True).count()
        total_collected = FeePayment.objects.filter(organization=organization).aggregate(total=Sum("amount")).get("total") or 0
        total_outstanding = FeeInvoice.objects.filter(organization=organization).aggregate(total=Sum("balance_due")).get("total") or 0
        recent_payments = [
            {
                "label": payment.invoice.student.full_name,
                "subtext": payment.receipt_number,
                "value": str(payment.amount),
            }
            for payment in FeePayment.objects.filter(organization=organization).select_related("invoice__student")[:5]
        ]

        return {
            "organization_type": "education",
            "headline_metrics": [
                {"label": "Enrolled Pupils", "value": total_students},
                {"label": "Classes", "value": total_classes},
                {"label": "Fees Collected", "value": f"ZMW {total_collected:.2f}"},
                {"label": "Outstanding Balances", "value": f"ZMW {total_outstanding:.2f}"},
            ],
            "charts": [],
            "tables": [
                {
                    "title": "Recent Fee Payments",
                    "rows": recent_payments,
                }
            ],
        }

    sales_total = Sale.objects.filter(organization=organization).aggregate(total=Sum("total_amount")).get("total") or 0
    cash_in = Sale.objects.filter(organization=organization).aggregate(total=Sum("amount_paid")).get("total") or 0
    expenses_total = Expense.objects.filter(organization=organization).aggregate(total=Sum("amount")).get("total") or 0
    low_stock_items = Product.objects.filter(
        organization=organization,
        is_active=True,
        current_stock__lte=models.F("reorder_level"),
    ).count()
    unpaid_sales = Sale.objects.filter(
        organization=organization,
        payment_status__in=[Sale.PaymentStatus.UNPAID, Sale.PaymentStatus.PARTIAL],
    ).count()
    top_products = (
        SaleItem.objects.filter(sale__organization=organization)
        .values("product__name")
        .annotate(total_quantity=Sum("quantity"))
        .order_by("-total_quantity")[:5]
    )

    return {
        "organization_type": "retail",
        "headline_metrics": [
            {"label": "Total Sales", "value": f"ZMW {sales_total:.2f}"},
            {"label": "Cash In", "value": f"ZMW {cash_in:.2f}"},
            {"label": "Expenses", "value": f"ZMW {expenses_total:.2f}"},
            {"label": "Cash Position", "value": f"ZMW {(cash_in - expenses_total):.2f}"},
        ],
        "charts": [],
        "tables": [
            {
                "title": "Operational Alerts",
                "rows": [
                    {"label": "Low Stock Items", "value": low_stock_items},
                    {"label": "Unpaid Sales", "value": unpaid_sales},
                ],
            },
            {
                "title": "Top Selling Products",
                "rows": [
                    {"label": item["product__name"], "value": item["total_quantity"]}
                    for item in top_products
                ],
            },
        ],
    }
