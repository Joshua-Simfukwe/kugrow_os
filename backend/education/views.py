from django.db.models import Count
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.organization import get_active_organization
from .models import FeeInvoice, FeePayment, Guardian, SchoolClass, Student
from .serializers import (
    FeeInvoiceSerializer,
    FeeInvoiceWriteSerializer,
    FeePaymentSerializer,
    FeePaymentWriteSerializer,
    GuardianSerializer,
    GuardianWriteSerializer,
    SchoolClassSerializer,
    SchoolClassWriteSerializer,
    StudentSerializer,
    StudentWriteSerializer,
)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def school_class_list(request):
    organization = get_active_organization(request)
    if request.method == "GET":
        classes = SchoolClass.objects.filter(organization=organization).annotate(student_count=Count("students"))
        return Response(SchoolClassSerializer(classes, many=True).data)

    serializer = SchoolClassWriteSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        record = serializer.save()
        return Response(SchoolClassSerializer(record).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def guardian_list(request):
    organization = get_active_organization(request)
    if request.method == "GET":
        guardians = Guardian.objects.filter(organization=organization)
        return Response(GuardianSerializer(guardians, many=True).data)

    serializer = GuardianWriteSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        guardian = serializer.save()
        return Response(GuardianSerializer(guardian).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def student_list(request):
    organization = get_active_organization(request)
    if request.method == "GET":
        students = Student.objects.filter(organization=organization).select_related("school_class", "guardian")
        return Response(StudentSerializer(students, many=True).data)

    serializer = StudentWriteSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        student = serializer.save()
        return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def fee_invoice_list(request):
    organization = get_active_organization(request)
    if request.method == "GET":
        invoices = FeeInvoice.objects.filter(organization=organization).select_related("student", "student__school_class")
        return Response(FeeInvoiceSerializer(invoices, many=True).data)

    serializer = FeeInvoiceWriteSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        invoice = serializer.save()
        return Response(FeeInvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def fee_payment_list(request):
    organization = get_active_organization(request)
    if request.method == "GET":
        payments = FeePayment.objects.filter(organization=organization).select_related("invoice", "invoice__student")
        return Response(FeePaymentSerializer(payments, many=True).data)

    serializer = FeePaymentWriteSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        payment = serializer.save()
        return Response(FeePaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
