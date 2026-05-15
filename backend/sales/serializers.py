from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from common.organization import get_active_branch, get_active_organization
from .models import Sale, SaleItem
from inventory.models import Product


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = ['product', 'product_name', 'quantity', 'price']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    items_data = SaleItemSerializer(many=True, write_only=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    customer_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Sale
        fields = [
            'id',
            'receipt_number',
            'customer_name',
            'payment_method',
            'payment_status',
            'amount_paid',
            'balance_due',
            'total_amount',
            'notes',
            'created_at',
            'items',
            'items_data',
        ]

    def _generate_receipt_number(self, organization):
        today = timezone.localdate()
        prefix = f"RCPT-{today.strftime('%Y%m%d')}"
        count = Sale.objects.filter(
            organization=organization,
            receipt_number__startswith=prefix,
        ).count() + 1
        return f"{prefix}-{count:04d}"

    def create(self, validated_data):
        items_data = validated_data.pop('items_data')
        request = self.context["request"]
        organization = get_active_organization(request)
        branch = get_active_branch(request, organization)
        amount_paid = validated_data.pop("amount_paid", None)

        with transaction.atomic():
            sale = Sale.objects.create(
                organization=organization,
                branch=branch,
                created_by=request.user,
                receipt_number=self._generate_receipt_number(organization),
                **validated_data,
            )
            total = 0

            for item in items_data:
                product = item['product']
                quantity = item['quantity']
                price = item['price']

                if product.organization_id and product.organization_id != organization.id:
                    raise serializers.ValidationError("Product does not belong to the active organization.")
                if quantity <= 0:
                    raise serializers.ValidationError("Quantity must be > 0")

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    price=price
                )

                total += quantity * price

            resolved_amount_paid = total if amount_paid is None else amount_paid
            if resolved_amount_paid < 0:
                raise serializers.ValidationError("Amount paid cannot be negative.")
            if resolved_amount_paid > total:
                raise serializers.ValidationError("Amount paid cannot exceed the total amount.")

            sale.total_amount = total
            sale.amount_paid = resolved_amount_paid
            sale.balance_due = total - resolved_amount_paid
            if sale.balance_due == 0:
                sale.payment_status = Sale.PaymentStatus.PAID
                sale.is_paid = True
            elif sale.amount_paid == 0:
                sale.payment_status = Sale.PaymentStatus.UNPAID
                sale.is_paid = False
            else:
                sale.payment_status = Sale.PaymentStatus.PARTIAL
                sale.is_paid = False
            sale.save()

        return sale
