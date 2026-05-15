from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from common.organization import get_active_organization
from .models import Sale
from .serializers import SaleSerializer

@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_sale(request):
    if request.method == "GET":
        organization = get_active_organization(request)
        query = request.query_params.get("q", "").strip()
        sales = Sale.objects.filter(organization=organization).prefetch_related("items__product")
        if query:
            sales = sales.filter(
                Q(receipt_number__icontains=query) | Q(customer_name__icontains=query)
            )
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    serializer = SaleSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
