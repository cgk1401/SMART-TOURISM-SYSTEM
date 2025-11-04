from django.contrib import admin
from django.urls import path, include
from . import views


urlpatterns = [
    path('', views.function_login),
    path('register/', views.function_register),
    path('check_login/', views.check_login),
    path('check_register/', views.check_register)
]

