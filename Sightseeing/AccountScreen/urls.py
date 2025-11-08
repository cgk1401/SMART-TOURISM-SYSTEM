from django.urls import path
from . import views

urlpatterns = [
    path('', views.account_view, name='account'),
    path('history/', views.history_view, name='history'),
]