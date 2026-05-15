from django.conf import settings
from django.db import models
from inventory.models import InventoryTransaction, Product
from users.models import Branch, Organization

# Create your models here.

class Sale(models.Model):
    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"

    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('AIRTEL', 'Airtel Money'),
        ('MTN', 'MTN Money'),
        ('BANK', 'Bank Transfer'),
        ('CREDIT', 'Credit'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="sales",
        null=True,
        blank=True,
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="sales",
        null=True,
        blank=True,
    )
    receipt_number = models.CharField(max_length=30, blank=True)
    customer_name = models.CharField(max_length=150, blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PAID,
    )
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_sales",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.receipt_number or f"Sale {self.id}"
    
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
                    organization=self.sale.organization,
                    branch=self.sale.branch,
                    product=self.product,
                    quantity=abs(difference),
                    transaction_type=transaction_type,
                    reference=self.sale.receipt_number or f"Sale {self.sale.id}"
                )

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            InventoryTransaction.objects.create(
                organization=self.sale.organization,
                branch=self.sale.branch,
                product=self.product,
                quantity=self.quantity,
                transaction_type='IN',
                reference=f"Delete {self.sale.receipt_number or self.id}"
            )

            super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


