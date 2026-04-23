from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.
# Category
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at =models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

   
# Supplier
class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=150, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Product
class Product(models.Model):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=100, unique=True)
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)

    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    current_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)

    expiry_days = models.IntegerField(default=0)  # 0 = no expiry tracking

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# InventoryTransaction
class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJUST', 'Adjustment'),
        ('DAMAGED', 'Damaged'),
        ('MISSING', 'Missing'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    
    reference = models.CharField(max_length=255, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.transaction_type} - {self.quantity}"

    def clean(self):
        if self.transaction_type in ['OUT', 'DAMAGED', 'MISSING']:
            if self.product.current_stock < self.quantity:
                raise ValidationError("Not enough stock available")

    def save(self, *args, **kwargs):
        if self.transaction_type == 'IN':
            self.product.current_stock += self.quantity

        elif self.transaction_type == 'OUT':
            self.product.current_stock -= self.quantity

        elif self.transaction_type == 'ADJUST':
            self.product.current_stock = self.quantity

        elif self.transaction_type in ['DAMAGED', 'MISSING']:
            self.product.current_stock -= self.quantity

        self.product.save()

        super().save(*args, **kwargs)