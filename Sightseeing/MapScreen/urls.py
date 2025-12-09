from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.Render_Map),
    path('getLocation/', views.geocode),
    path("getWeather/", views.get_weather),
]