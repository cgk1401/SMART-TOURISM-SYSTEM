from django.contrib import admin
from django.urls import path, include
from . import views


urlpatterns = [
    path('', views.function_AboutUs),
    path('upload_team_photo/', views.upload_team_photo, name='upload_team_photo'),
]

