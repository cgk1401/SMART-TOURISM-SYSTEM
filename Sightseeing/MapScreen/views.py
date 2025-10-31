from django.shortcuts import render
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt


def render_map(request):
    return render(request, 'app/Map.html')
    