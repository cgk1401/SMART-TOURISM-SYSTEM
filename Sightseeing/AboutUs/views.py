from django.shortcuts import render

def function_AboutUs(request):
    return render(request, 'app/AboutUs.html')