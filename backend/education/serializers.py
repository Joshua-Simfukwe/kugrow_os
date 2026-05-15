from django.db import transaction
from rest_framework import serializers

from common.organization import get_active_organization
from .models import FeeInvoice, FeePayment, Guardian, SchoolClass, Student


class SchoolClassSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = SchoolClass
        fields = ["id", "name", "level", "student_count", "is_active"]


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ["id", "full_name", "phone_number", "email", "relationship"]


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    guardian_name = serializers.CharField(source="guardian.full_name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "admission_number",
            "first_name",
            "last_name",
            "full_name",
            "school_class",
            "school_class_name",
            "guardian",
            "guardian_name",
            "enrolled_on",
            "is_active",
        ]


class FeeInvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    school_class_name = serializers.CharField(source="student.school_class.name", read_only=True)

    class Meta:
        model = FeeInvoice
        fields = [
            "id",
            "student",
            "student_name",
            "school_class_name",
            "term_label",
            "amount_due",
            "amount_paid",
            "balance_due",
            "status",
            "issued_on",
            "due_on",
        ]


class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="invoice.student.full_name", read_only=True)

    class Meta:
        model = FeePayment
        fields = [
            "id",
            "invoice",
            "student_name",
            "receipt_number",
            "amount",
            "payment_method",
            "received_on",
            "notes",
        ]


class SchoolClassWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = ["name", "level", "is_active"]

    def create(self, validated_data):
        organization = get_active_organization(self.context["request"])
        return SchoolClass.objects.create(organization=organization, **validated_data)


class GuardianWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ["full_name", "phone_number", "email", "relationship"]

    def create(self, validated_data):
        organization = get_active_organization(self.context["request"])
        return Guardian.objects.create(organization=organization, **validated_data)


class StudentWriteSerializer(serializers.Serializer):
    admission_number = serializers.CharField(max_length=50)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    school_class_id = serializers.IntegerField()
    guardian_id = serializers.IntegerField(required=False, allow_null=True)
    enrolled_on = serializers.DateField(required=False)

    def create(self, validated_data):
        organization = get_active_organization(self.context["request"])
        try:
            school_class = SchoolClass.objects.get(
                pk=validated_data.pop("school_class_id"),
                organization=organization,
            )
        except SchoolClass.DoesNotExist as exc:
            raise serializers.ValidationError({"school_class_id": "Class not found."}) from exc

        guardian = None
        guardian_id = validated_data.pop("guardian_id", None)
        if guardian_id:
            try:
                guardian = Guardian.objects.get(pk=guardian_id, organization=organization)
            except Guardian.DoesNotExist as exc:
                raise serializers.ValidationError({"guardian_id": "Guardian not found."}) from exc

        return Student.objects.create(
            organization=organization,
            school_class=school_class,
            guardian=guardian,
            **validated_data,
        )


class FeeInvoiceWriteSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    term_label = serializers.CharField(max_length=100)
    amount_due = serializers.DecimalField(max_digits=12, decimal_places=2)
    due_on = serializers.DateField(required=False, allow_null=True)

    def create(self, validated_data):
        organization = get_active_organization(self.context["request"])
        try:
            student = Student.objects.get(pk=validated_data.pop("student_id"), organization=organization)
        except Student.DoesNotExist as exc:
            raise serializers.ValidationError({"student_id": "Student not found."}) from exc

        amount_due = validated_data["amount_due"]
        return FeeInvoice.objects.create(
            organization=organization,
            student=student,
            created_by=self.context["request"].user,
            amount_paid=0,
            balance_due=amount_due,
            **validated_data,
        )


class FeePaymentWriteSerializer(serializers.Serializer):
    invoice_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=FeePayment.PAYMENT_METHODS)
    received_on = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def create(self, validated_data):
        organization = get_active_organization(self.context["request"])
        try:
            invoice = FeeInvoice.objects.select_for_update().get(
                pk=validated_data.pop("invoice_id"),
                organization=organization,
            )
        except FeeInvoice.DoesNotExist as exc:
            raise serializers.ValidationError({"invoice_id": "Invoice not found."}) from exc

        amount = validated_data["amount"]
        if amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})
        if amount > invoice.balance_due:
            raise serializers.ValidationError({"amount": "Amount cannot exceed the invoice balance."})

        with transaction.atomic():
            payment = FeePayment.objects.create(
                organization=organization,
                invoice=invoice,
                created_by=self.context["request"].user,
                **validated_data,
            )

        return payment
