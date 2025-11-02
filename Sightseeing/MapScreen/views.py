from django.shortcuts import render
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import os

API_KEY_MAP = os.getenv("API_KEY_MAP") 

def render_map(request):
    return render(request, 'app/Map.html')

@csrf_exempt
def get_route(request):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    
    data = json.loads(request.body)
    coords = []
    for lat, lon in data["coordinates"]:
        coords.append([lon, lat])
    
    headers = {
        "Authorization": API_KEY_MAP,
        "Content-Type": "application/json"
    }
    body = {"coordinates": coords}
    
    response = requests.post(url, json=body, headers=headers)
    
    return JsonResponse(response.json())
    