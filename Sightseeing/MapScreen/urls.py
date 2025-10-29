from django.urls import path
from .views import main_screen, map_screen

urlpatterns = [
    path('', main_screen),
    path('MapScreen', map_screen),
]

