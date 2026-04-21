from django.db import models

# Create your models here.
# Category
class category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at =models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name    
# Supplier
# Product
# ProductPrice
# StockBatch
# InventoryTransaction