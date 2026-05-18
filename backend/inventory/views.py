from common.access import require_any_module_access, require_module_access
from common.organization import get_active_branch, get_active_organization
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import InventoryTransaction, Product
from .serializers import (
    InventoryAdjustmentSerializer,
    InventoryTransactionSerializer,
    ProductSerializer,
    ProductWriteSerializer,
)

@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def product_list(request):
    if request.method == "GET":
        require_any_module_access(request, {"inventory", "pos"})
    else:
        require_module_access(request, "inventory")
    organization = get_active_organization(request)
    branch = get_active_branch(request, organization)

    if request.method == "GET":
        products = Product.objects.filter(
            organization=organization,
            is_active=True,
        ).select_related("category")
        serializer = ProductSerializer(
            products,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    serializer = ProductWriteSerializer(
        data=request.data,
        context={
            "request": request,
            "organization": organization,
            "branch": branch,
        },
    )
    if serializer.is_valid():
        product = serializer.save()
        response_serializer = ProductSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def inventory_transaction_list(request):
    require_module_access(request, "inventory")
    organization = get_active_organization(request)
    branch = get_active_branch(request, organization)

    transactions = (
        InventoryTransaction.objects.filter(organization=organization, branch=branch)
        .select_related("product", "branch")
        .order_by("-created_at")[:50]
    )
    serializer = InventoryTransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_inventory_adjustment(request):
    require_module_access(request, "inventory")
    organization = get_active_organization(request)
    branch = get_active_branch(request, organization)

    serializer = InventoryAdjustmentSerializer(
        data=request.data,
        context={
            "request": request,
            "organization": organization,
            "branch": branch,
        },
    )
    if serializer.is_valid():
        transaction = serializer.save()
        response_serializer = InventoryTransactionSerializer(transaction)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
