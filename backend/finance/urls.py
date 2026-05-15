from django.urls import path

from .views import dashboard_summary, expense_category_list, expense_list

urlpatterns = [
    path("dashboard/summary/", dashboard_summary),
    path("expense-categories/", expense_category_list),
    path("expenses/", expense_list),
]
