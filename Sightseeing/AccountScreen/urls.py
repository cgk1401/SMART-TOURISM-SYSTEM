from django.urls import path
from . import views

app_name = "AccountScreen"

# URL patterns for the AccountScreen app. These map to the views implemented
# in `AccountScreen/views.py`.
urlpatterns = [
    # Account landing page: /account/
    path('', views.index, name='index'),

    # # Update profile: expects POST, redirects back to index
    # path('profile/update/', views.update_profile, name='update_profile'),

    # # Update avatar: expects POST with file
    # path('update-avatar/', views.update_avatar, name='update_avatar'),

    # History page: /account/history/
    path('history/', views.history, name='history'),
]
