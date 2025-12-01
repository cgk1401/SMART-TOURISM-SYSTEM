from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.function_preference),
    path('save_preference/', views.save_preference, name='save_preference'),
    path('save_preference/list_trip/', views.generate_itinerary, name='generate_itinerary'),
    path('delete_pref/<int:pref_id>/', views.delete_preference, name='delete_preference')
]