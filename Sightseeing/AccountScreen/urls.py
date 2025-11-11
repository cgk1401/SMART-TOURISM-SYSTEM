from django.urls import path
from . import views

app_name = "AccountScreen"

urlpatterns = [
    path('', views.account_view, name='account'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('history/', views.history, name='history'),
]
