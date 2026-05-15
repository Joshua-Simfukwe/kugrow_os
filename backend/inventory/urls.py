from django.urls import path

from .views import create_inventory_adjustment, inventory_transaction_list, product_list

urlpatterns = [
    path("products/", product_list),
    path("transactions/", inventory_transaction_list),
    path("adjustments/", create_inventory_adjustment),
]
