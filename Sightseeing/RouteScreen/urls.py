from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.function_Route),
    path('getLocation/', views.geocode),
    path("getWeather/", views.get_weather),
    path("autocomplete/", views.autocomplete_places),
    path("get_similar_location/", views.get_similar_locations),
    path("getRoute/", views.get_route),
    path('getdetailsRoute/<int:trip_id>/', views.detailsRoute),
    path('myTrips/', views.function_MyTrip),
    path('SaveTrip/', views.saveTripBeforeEdit),
    path('getunSavedTrip/', views.getUnsavedTrips),
    path('getallTrips/', views.getAllTrips),
    path('updateTrips/', views.Update_Trip),
    path('test-hardcoded-route/', views.test_optimize_route_view, name='test_optimize_route'),
    path('optimize_route_fast/', views.optimize_route_fast_view)
]