from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

from users.models import Organization


class SchoolClass(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="school_classes",
    )
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("organization", "name")

    def __str__(self):
        return self.name


class Guardian(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="guardians",
    )
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    relationship = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class Student(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="students",
    )
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.PROTECT,
        related_name="students",
    )
    guardian = models.ForeignKey(
        Guardian,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    admission_number = models.CharField(max_length=50)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    enrolled_on = models.DateField(default=timezone.localdate)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["last_name", "first_name"]
        unique_together = ("organization", "admission_number")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class FeeInvoice(models.Model):
    class Status(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="fee_invoices",
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="fee_invoices",
    )
    term_label = models.CharField(max_length=100)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    issued_on = models.DateField(default=timezone.localdate)
    due_on = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_fee_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-issued_on", "-id"]

    def __str__(self):
        return f"{self.student.full_name} - {self.term_label}"

    def refresh_balance(self):
        total_paid = self.payments.aggregate(total=models.Sum("amount")).get("total") or 0
        self.amount_paid = total_paid
        self.balance_due = self.amount_due - total_paid
        if self.balance_due <= 0:
            self.status = self.Status.PAID
        elif total_paid > 0:
            self.status = self.Status.PARTIAL
        else:
            self.status = self.Status.UNPAID
        self.save(update_fields=["amount_paid", "balance_due", "status"])


class FeePayment(models.Model):
    PAYMENT_METHODS = [
        ("CASH", "Cash"),
        ("AIRTEL", "Airtel Money"),
        ("MTN", "MTN Money"),
        ("BANK", "Bank Transfer"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="fee_payments",
    )
    invoice = models.ForeignKey(
        FeeInvoice,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    receipt_number = models.CharField(max_length=30, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    received_on = models.DateField(default=timezone.localdate)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_fee_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-received_on", "-id"]

    def __str__(self):
        return self.receipt_number or f"Fee Payment {self.id}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        with transaction.atomic():
            if is_new and not self.receipt_number:
                prefix = f"FEE-{timezone.localdate().strftime('%Y%m%d')}"
                count = (
                    FeePayment.objects.filter(
                        organization=self.organization,
                        receipt_number__startswith=prefix,
                    ).count()
                    + 1
                )
                self.receipt_number = f"{prefix}-{count:04d}"

            super().save(*args, **kwargs)
            if is_new:
                self.invoice.refresh_balance()
