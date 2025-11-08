from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.function_preference),
    path('save_preference/', views.save_preference, name='save_preference'),
    path('delete_pref/<int:pref_id>/', views.delete_preference, name='delete_preference')
]