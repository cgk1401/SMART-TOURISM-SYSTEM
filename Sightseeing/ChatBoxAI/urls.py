from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_page),
    path('api/chat/', views.chat_api, name='ai_chat'),
]

