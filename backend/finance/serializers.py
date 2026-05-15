from datetime import timedelta

from django.db import models
from django.db.models import Sum
from django.utils import timezone
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
    headline_metrics = serializers.ListField(child=serializers.DictField())
    charts = serializers.ListField(child=serializers.DictField(), required=False)
    tables = serializers.ListField(child=serializers.DictField(), required=False)
    overview = serializers.DictField(required=False)
    alerts = serializers.ListField(child=serializers.DictField(), required=False)
    growth = serializers.DictField(required=False)
    spending_safety = serializers.DictField(required=False)
    debt = serializers.DictField(required=False)
    upcoming = serializers.ListField(child=serializers.DictField(), required=False)
    quick_actions = serializers.ListField(child=serializers.DictField(), required=False)


def _format_currency(value):
    numeric_value = value or 0
    return f"ZMW {numeric_value:.2f}"


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

    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_last_week = start_of_week - timedelta(days=7)
    end_of_last_week = start_of_week - timedelta(days=1)
    next_seven_days = today + timedelta(days=7)

    sales_queryset = Sale.objects.filter(organization=organization)
    expenses_queryset = Expense.objects.filter(organization=organization)
    products_queryset = Product.objects.filter(organization=organization, is_active=True)

    sales_total = sales_queryset.aggregate(total=Sum("total_amount")).get("total") or 0
    cash_in = sales_queryset.aggregate(total=Sum("amount_paid")).get("total") or 0
    expenses_total = expenses_queryset.aggregate(total=Sum("amount")).get("total") or 0

    sales_today = sales_queryset.filter(created_at__date=today).aggregate(total=Sum("total_amount")).get("total") or 0
    expenses_today = expenses_queryset.filter(incurred_on=today).aggregate(total=Sum("amount")).get("total") or 0
    sales_yesterday = sales_queryset.filter(created_at__date=yesterday).aggregate(total=Sum("total_amount")).get("total") or 0
    sales_this_week = sales_queryset.filter(created_at__date__gte=start_of_week).aggregate(total=Sum("total_amount")).get("total") or 0
    sales_last_week = sales_queryset.filter(
        created_at__date__gte=start_of_last_week,
        created_at__date__lte=end_of_last_week,
    ).aggregate(total=Sum("total_amount")).get("total") or 0

    low_stock_items = products_queryset.filter(
        organization=organization,
        is_active=True,
        current_stock__lte=models.F("reorder_level"),
    )
    low_stock_count = low_stock_items.count()
    unpaid_sales = sales_queryset.filter(
        payment_status__in=[Sale.PaymentStatus.UNPAID, Sale.PaymentStatus.PARTIAL],
    )
    unpaid_sales_count = unpaid_sales.count()
    top_products = (
        SaleItem.objects.filter(sale__organization=organization)
        .values("product__name")
        .annotate(total_quantity=Sum("quantity"))
        .order_by("-total_quantity")[:5]
    )
    gross_margin_today = 0
    for item in (
        SaleItem.objects.filter(sale__organization=organization, sale__created_at__date=today)
        .select_related("product")
    ):
        gross_margin_today += (item.price - item.product.cost_price) * item.quantity
    profit_today = gross_margin_today - expenses_today

    owned_stock_value = 0
    agency_stock_value = 0
    for product in products_queryset:
        stock_value = product.current_stock * product.cost_price
        if product.ownership_type == Product.OwnershipType.AGENCY:
            agency_stock_value += stock_value
        else:
            owned_stock_value += stock_value

    customer_credit = unpaid_sales.aggregate(total=Sum("balance_due")).get("total") or 0
    future_commitments_qs = expenses_queryset.filter(
        incurred_on__gt=today,
        incurred_on__lte=next_seven_days,
    ).order_by("incurred_on", "id")
    future_commitments_total = future_commitments_qs.aggregate(total=Sum("amount")).get("total") or 0
    available_to_spend = cash_in - expenses_total - future_commitments_total
    repayment_days = max((next_seven_days - today).days, 1)
    debt_clearance_months = (customer_credit / sales_today) * 30 if sales_today else 0

    trend_points = []
    for offset in range(6, -1, -1):
        chart_day = today - timedelta(days=offset)
        chart_total = (
            sales_queryset.filter(created_at__date=chart_day)
            .aggregate(total=Sum("total_amount"))
            .get("total")
            or 0
        )
        trend_points.append(
            {
                "label": chart_day.strftime("%a"),
                "value": float(chart_total),
            }
        )

    today_vs_yesterday = (
        ((sales_today - sales_yesterday) / sales_yesterday) * 100 if sales_yesterday else 0
    )
    this_week_vs_last_week = (
        ((sales_this_week - sales_last_week) / sales_last_week) * 100
        if sales_last_week
        else 0
    )

    alerts = []
    for product in low_stock_items[:3]:
        alerts.append(
            {
                "tone": "critical",
                "title": f"Low stock: {product.name}",
                "description": f"Only {product.current_stock} units left in active stock.",
            }
        )
    if unpaid_sales_count:
        alerts.append(
            {
                "tone": "warning",
                "title": f"{unpaid_sales_count} sale(s) still have unpaid balances",
                "description": f"Outstanding customer credit is {_format_currency(customer_credit)}.",
            }
        )
    if profit_today < 0:
        alerts.append(
            {
                "tone": "critical",
                "title": "Today is currently running below profit",
                "description": "Expenses are ahead of gross margin for today.",
            }
        )

    upcoming = [
        {
            "title": expense.title,
            "subtext": f"In {(expense.incurred_on - today).days} day(s)",
            "amount": _format_currency(expense.amount),
        }
        for expense in future_commitments_qs[:5]
    ]

    return {
        "organization_type": "retail",
        "overview": {
            "store_name": organization.name,
            "organization_type": organization.get_organization_type_display(),
        },
        "quick_actions": [
            {"label": "Open POS", "route": "/pos", "module": "pos", "tone": "success"},
            {"label": "Inventory", "route": "/inventory", "module": "inventory", "tone": "primary"},
            {"label": "Add Stock", "route": "/inventory?action=add-stock", "module": "inventory", "tone": "secondary"},
        ],
        "headline_metrics": [
            {"label": "Sales", "value": _format_currency(sales_today)},
            {"label": "Margin", "value": _format_currency(gross_margin_today)},
            {"label": "Expenses", "value": _format_currency(expenses_today)},
            {"label": "Profit", "value": _format_currency(profit_today)},
        ],
        "charts": [{"title": "7-Day Sales", "points": trend_points}],
        "alerts": alerts,
        "growth": {
            "cards": [
                {
                    "label": "Today vs Yesterday",
                    "value": round(today_vs_yesterday, 1),
                    "tone": "positive" if today_vs_yesterday >= 0 else "negative",
                },
                {
                    "label": "This Week vs Last Week",
                    "value": round(this_week_vs_last_week, 1),
                    "tone": "positive" if this_week_vs_last_week >= 0 else "negative",
                },
            ],
            "points": trend_points,
        },
        "spending_safety": {
            "available_to_spend": _format_currency(max(available_to_spend, 0)),
            "status": "healthy" if available_to_spend >= 0 else "warning",
            "message": (
                "You can spend within the next week without eating into committed cash."
                if available_to_spend >= 0
                else "Upcoming commitments are higher than your current free cash position."
            ),
        },
        "debt": {
            "total": _format_currency(customer_credit),
            "message": (
                f"At today's repayment pace, you could clear this exposure in about {debt_clearance_months:.1f} day-equivalents."
                if customer_credit
                else "No unpaid customer balances are currently recorded."
            ),
        },
        "upcoming": upcoming,
        "tables": [
            {
                "title": "Business Position",
                "rows": [
                    {"label": "Cash Available", "value": _format_currency(cash_in - expenses_total)},
                    {"label": "Stock (Agency)", "value": _format_currency(agency_stock_value)},
                    {"label": "Stock (Owned)", "value": _format_currency(owned_stock_value)},
                    {"label": "Customer Credit", "value": _format_currency(customer_credit)},
                    {"label": "Planned Commitments", "value": _format_currency(future_commitments_total)},
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
