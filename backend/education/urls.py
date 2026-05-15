from django.urls import path

from .views import fee_invoice_list, fee_payment_list, guardian_list, school_class_list, student_list

urlpatterns = [
    path("classes/", school_class_list),
    path("guardians/", guardian_list),
    path("students/", student_list),
    path("fee-invoices/", fee_invoice_list),
    path("fee-payments/", fee_payment_list),
]
