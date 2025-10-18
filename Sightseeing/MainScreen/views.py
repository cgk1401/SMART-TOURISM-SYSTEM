from django.shortcuts import render
from django.http import HttpRequest

# Create your views here.

def function_Main(request):
    return render(request, 'app/Main.html')