from django.contrib import admin
from .models import Category, Supplier, Product, InventoryTransaction

# Register your models here.
admin.site.register(Category)
admin.site.register(Supplier)
admin.site.register(Product)
admin.site.register(InventoryTransaction)