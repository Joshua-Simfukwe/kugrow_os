from django.db import models
from django.db import models
from inventory.models import InventoryTransaction, Product

# Create your models here.

class Sale(models.Model):
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('AIRTEL', 'Airtel Money'),
        ('MTN', 'MTN Money'),
        ('BANK', 'Bank Transfer'),
        ('CREDIT', 'Credit'),
    ]

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    is_paid = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_total(self):
        total = sum(item.quantity * item.price for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=['total_amount'])

    def __str__(self):
        return f"Sale {self.id} - {self.total_amount}"
    
class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        is_new = self.pk is None  # check if creating for first time

        super().save(*args, **kwargs)

        if is_new:
            # create inventory transaction only once
            InventoryTransaction.objects.create(
                product=self.product,
                quantity=self.quantity,
                transaction_type='OUT',
                reference=f"Sale {self.sale.id}"
            )

        # update total every time
        self.sale.calculate_total()

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


