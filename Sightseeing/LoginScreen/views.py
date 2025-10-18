from django.shortcuts import render
from django.http import HttpRequest

# Create your views here.

def function_login(request):
    return render(request, 'app/login.html')