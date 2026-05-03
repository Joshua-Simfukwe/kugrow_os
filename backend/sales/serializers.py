from rest_framework import serializers
from django.db import transaction
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

    class Meta:
        model = Sale
        fields = ['id', 'payment_method', 'total_amount', 'created_at', 'items', 'items_data']

    def create(self, validated_data):
        items_data = validated_data.pop('items_data')

        with transaction.atomic():

            sale = Sale.objects.create(**validated_data)

            total = 0

            for item in items_data:
                product = item['product']
                quantity = item['quantity']
                price = item['price']

                # Optional: basic validation
                if quantity <= 0:
                    raise serializers.ValidationError("Quantity must be > 0")

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    price=price
                )

                total += quantity * price

            sale.total_amount = total
            sale.save()

        return sale