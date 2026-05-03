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

    def __str__(self):
        return f"Sale {self.id} - {self.total_amount}"
    
from django.db import transaction

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        is_new = self._state.adding

        with transaction.atomic():

            if not is_new:
                old_item = SaleItem.objects.get(pk=self.pk)
                difference = self.quantity - old_item.quantity
            else:
                difference = self.quantity

            super().save(*args, **kwargs)

            if difference != 0:
                transaction_type = 'OUT' if difference > 0 else 'IN'

                InventoryTransaction.objects.create(
                    product=self.product,
                    quantity=abs(difference),
                    transaction_type=transaction_type,
                    reference=f"Sale {self.sale.id}"
                )

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            InventoryTransaction.objects.create(
                product=self.product,
                quantity=self.quantity,
                transaction_type='IN',
                reference=f"Delete SaleItem {self.id}"
            )

            super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


