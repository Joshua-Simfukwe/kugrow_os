from common.access import require_module_access
from django.db.models import Sum
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.organization import get_active_organization

from .models import Expense, ExpenseCategory
from .serializers import (
    DashboardSummarySerializer,
    ExpenseCategorySerializer,
    ExpenseCreateSerializer,
    ExpenseSerializer,
    build_dashboard_summary,
)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def expense_category_list(request):
    require_module_access(request, "settings")
    organization = get_active_organization(request)
    if request.method == "GET":
        categories = ExpenseCategory.objects.filter(organization=organization, is_active=True)
        return Response(ExpenseCategorySerializer(categories, many=True).data)

    serializer = ExpenseCategorySerializer(data=request.data)
    if serializer.is_valid():
        category = ExpenseCategory.objects.create(organization=organization, **serializer.validated_data)
        return Response(ExpenseCategorySerializer(category).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def expense_list(request):
    require_module_access(request, "settings")
    organization = get_active_organization(request)
    if request.method == "GET":
        expenses = Expense.objects.filter(organization=organization).select_related("category", "branch")
        return Response(ExpenseSerializer(expenses, many=True).data)

    serializer = ExpenseCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        expense = serializer.save()
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    require_module_access(request, "dashboard")
    organization = get_active_organization(request)
    payload = build_dashboard_summary(organization)
    serializer = DashboardSummarySerializer(payload)
    return Response(serializer.data)
