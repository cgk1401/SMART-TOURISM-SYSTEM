from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.function_Route),
    path('getLocation/', views.geocode),
    path("getWeather/", views.get_weather),
]