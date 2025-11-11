from django.shortcuts import render, redirect
from django.http import HttpRequest
from django.http import HttpResponse
from django.contrib.auth import logout

# Create your views here.

def function_Main(request):
    return render(request, 'app/Main.html')

def logout_user(request):
    logout(request)
    return redirect('/')