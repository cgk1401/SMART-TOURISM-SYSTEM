from django.shortcuts import render, redirect
from django.http import HttpRequest
from django.contrib.auth import logout

# Create your views here.

def function_Discover(request):
    return render(request, 'app/discover.html')