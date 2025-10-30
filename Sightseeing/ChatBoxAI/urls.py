from django.urls import path
from . import views


urlpatterns = [
    path('api/chat/', views.ai_chat, name='ai_chat'),
]

