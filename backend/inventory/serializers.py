from rest_framework import serializers
from common.organization import get_active_branch
from .models import BranchStock, Category, InventoryTransaction, Product, Supplier

class ProductSerializer(serializers.ModelSerializer):
    branch_stock = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_name",
            "supplier_name",
            "selling_price",
            "cost_price",
            "current_stock",
            "ownership_type",
            "commission_rate",
            "reorder_level",
            "branch_stock",
        ]

    def get_branch_stock(self, obj):
        request = self.context.get("request")
        if request is None or not getattr(request.user, "is_authenticated", False):
            return obj.current_stock

        organization = getattr(request.user.profile, "active_organization", None)
        if organization is None:
            return obj.current_stock

        branch = get_active_branch(request, organization)
        stock = obj.branch_stocks.filter(branch=branch).values_list("current_stock", flat=True).first()
        return stock if stock is not None else 0


class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "product",
            "product_name",
            "branch_name",
            "quantity",
            "transaction_type",
            "reference",
            "note",
            "created_at",
        ]


class InventoryAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(
        choices=["IN", "ADJUST", "DAMAGED", "MISSING"]
    )
    quantity = serializers.IntegerField(min_value=0)
    reference = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        organization = self.context["organization"]
        try:
            product = Product.objects.get(
                pk=attrs["product_id"],
                organization=organization,
                is_active=True,
            )
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"product_id": "Product not found in the active organization."}
            ) from exc

        transaction_type = attrs["transaction_type"]
        quantity = attrs["quantity"]
        if transaction_type == "IN" and quantity <= 0:
            raise serializers.ValidationError({"quantity": "Add stock quantity must be greater than zero."})
        if transaction_type in ["DAMAGED", "MISSING"] and quantity <= 0:
            raise serializers.ValidationError({"quantity": "This adjustment quantity must be greater than zero."})

        attrs["product"] = product
        return attrs

    def create(self, validated_data):
        branch = self.context["branch"]
        organization = self.context["organization"]
        validated_data["product"] = validated_data.pop("product")
        validated_data["branch"] = branch
        validated_data["organization"] = organization
        validated_data.pop("product_id", None)
        return InventoryTransaction.objects.create(**validated_data)


class ProductWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    sku = serializers.CharField(max_length=100)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    supplier_id = serializers.IntegerField(required=False, allow_null=True)
    cost_price = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    opening_stock = serializers.IntegerField(default=0)
    reorder_level = serializers.IntegerField(default=0)
    ownership_type = serializers.ChoiceField(choices=Product.OwnershipType.choices, default=Product.OwnershipType.OWNED)
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)

    def validate(self, attrs):
        organization = self.context["organization"]
        category_id = attrs.get("category_id")
        supplier_id = attrs.get("supplier_id")

        if category_id:
            try:
                attrs["category"] = Category.objects.get(pk=category_id, organization=organization)
            except Category.DoesNotExist as exc:
                raise serializers.ValidationError({"category_id": "Category not found in this organization."}) from exc

        if supplier_id:
            try:
                attrs["supplier"] = Supplier.objects.get(pk=supplier_id, organization=organization)
            except Supplier.DoesNotExist as exc:
                raise serializers.ValidationError({"supplier_id": "Supplier not found in this organization."}) from exc

        return attrs

    def create(self, validated_data):
        organization = self.context["organization"]
        branch = self.context["branch"]
        user = self.context["request"].user
        opening_stock = validated_data.pop("opening_stock", 0)
        category = validated_data.pop("category", None)
        supplier = validated_data.pop("supplier", None)
        validated_data.pop("category_id", None)
        validated_data.pop("supplier_id", None)

        product = Product.objects.create(
            organization=organization,
            category=category,
            supplier=supplier,
            current_stock=0,
            **validated_data,
        )

        if opening_stock > 0:
            product.inventory_transactions.create(
                organization=organization,
                branch=branch,
                quantity=opening_stock,
                transaction_type="IN",
                reference="Opening stock",
                note=f"Created by {user.email}",
            )
        else:
            BranchStock.objects.create(
                product=product,
                branch=branch,
                current_stock=0,
                reorder_level=product.reorder_level,
            )

        return product
