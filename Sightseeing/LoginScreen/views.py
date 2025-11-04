from django.http import HttpRequest
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.contrib import messages


# Create your views here.

def function_login(request):
    return render(request, 'app/login.html')
def check_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        return redirect('/MainScreen/')

    else:
        return render(request, 'login.html', {'error': 'Invalid credentials'})
def register_user(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
        else:
            User.objects.create_user(username=username, password=password)
            messages.success(request, "Account created successfully")
            return redirect('/')

    return render(request, 'register.html')