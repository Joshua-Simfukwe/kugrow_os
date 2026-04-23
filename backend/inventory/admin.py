from django.contrib import admin
from .models import Category, Supplier, Product

# Register your models here.
admin.site.register(Category)
admin.site.register(Supplier)
admin.site.register(Product)