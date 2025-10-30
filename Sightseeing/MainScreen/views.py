from django.shortcuts import render
from django.http import HttpRequest
import folium
import requests
from django.http import HttpResponse

# Create your views here.

def function_Main(request):
    return render(request, 'app/Main.html')