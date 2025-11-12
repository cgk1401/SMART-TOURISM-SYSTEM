from django.shortcuts import render, redirect
from django.http import HttpRequest
from django.http import HttpResponse
from django.contrib.auth import logout

# Create your views here.

def function_Route(request):
    return render(request, 'app/Route.html')
