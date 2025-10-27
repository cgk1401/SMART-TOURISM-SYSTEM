from django.contrib import admin
from django.urls import path, include
from . import views


urlpatterns = [
    path('', views.function_Main),
    path('map/', views.function_Map, name='map'),
]
