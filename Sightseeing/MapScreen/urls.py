from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.render_map),
    path('api/route/', views.get_route),
    path('full_location/', views.all_location)
]