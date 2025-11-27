from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.function_Route),
    path('getLocation/', views.geocode),
    path("getWeather/", views.get_weather),
    path("autocomplete/", views.autocomplete_places),
    path("get_similar_location/", views.get_similar_locations),
    path("getRoute/", views.get_route)
]