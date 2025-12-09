from django.contrib import admin
from django.urls import path, include
from . import views


urlpatterns = [
    path('', views.function_Main),
    path('logout/', views.logout_user, name='logout'), # could be put in sightseeing/url
    path('api/trips/', views.getCommunityTrips),
    path('detailsRoute/<int:trip_id>/', views.detailsRoute)
]
