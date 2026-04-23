from django.db import models
from django.db import models
from inventory.models import Product

# Create your models here.

class Sale(models.Model):
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('AIRTEL', 'Airtel Money'),
        ('MTN', 'MTN Money'),
        ('BANK', 'Bank Transfer'),
        ('CREDIT', 'Credit'),
    ]

    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    is_paid = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale {self.id} - {self.total_amount}"
    
class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
