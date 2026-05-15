from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Sum

from users.models import Branch, Organization

# Create your models here.
# Category
class Category(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="inventory_categories",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at =models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name

   
# Supplier
class Supplier(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="suppliers",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=150, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

# Product
class Product(models.Model):
    class OwnershipType(models.TextChoices):
        OWNED = "owned", "Owned"
        AGENCY = "agency", "Agency"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="products",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=100, unique=True)
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)

    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ownership_type = models.CharField(
        max_length=20,
        choices=OwnershipType.choices,
        default=OwnershipType.OWNED,
    )
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    current_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)

    expiry_days = models.IntegerField(default=0)  # 0 = no expiry tracking

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def refresh_total_stock(self):
        total_stock = (
            self.branch_stocks.aggregate(total=Sum("current_stock")).get("total") or 0
        )
        self.current_stock = total_stock
        self.save(update_fields=["current_stock"])


class BranchStock(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="branch_stocks",
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="product_stocks",
    )
    current_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product", "branch")
        ordering = ["branch__name"]

    def __str__(self):
        return f"{self.product.name} @ {self.branch.name}"

# InventoryTransaction
class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJUST', 'Adjustment'),
        ('DAMAGED', 'Damaged'),
        ('MISSING', 'Missing'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="inventory_transactions",
        null=True,
        blank=True,
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="inventory_transactions",
        null=True,
        blank=True,
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inventory_transactions")
    quantity = models.IntegerField()
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    
    reference = models.CharField(max_length=255, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} - {self.transaction_type} - {self.quantity}"

    def clean(self):
        if self.organization_id and self.product.organization_id and self.organization_id != self.product.organization_id:
            raise ValidationError("Transaction organization must match the product organization.")

        if self.branch_id and self.organization_id and self.branch.organization_id != self.organization_id:
            raise ValidationError("Transaction branch must belong to the same organization.")

        if self.transaction_type in ['OUT', 'DAMAGED', 'MISSING']:
            branch_stock = self._get_branch_stock()
            if branch_stock.current_stock < self.quantity:
                raise ValidationError("Not enough stock available")

    def _get_branch_stock(self):
        branch = self.branch
        if branch is None:
            raise ValidationError("A branch is required for inventory transactions.")

        branch_stock, _ = BranchStock.objects.get_or_create(
            product=self.product,
            branch=branch,
            defaults={"reorder_level": self.product.reorder_level},
        )
        return branch_stock

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        self.organization = self.organization or self.product.organization

        with transaction.atomic():
            branch_stock = self._get_branch_stock()
            self.full_clean()

            if is_new:
                if self.transaction_type == 'IN':
                    branch_stock.current_stock += self.quantity
                elif self.transaction_type == 'OUT':
                    branch_stock.current_stock -= self.quantity
                elif self.transaction_type == 'ADJUST':
                    branch_stock.current_stock = self.quantity
                elif self.transaction_type in ['DAMAGED', 'MISSING']:
                    branch_stock.current_stock -= self.quantity

                branch_stock.reorder_level = self.product.reorder_level
                branch_stock.save()

            super().save(*args, **kwargs)

            if is_new:
                self.product.refresh_total_stock()
