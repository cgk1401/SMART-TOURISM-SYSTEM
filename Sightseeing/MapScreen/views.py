from django.shortcuts import render
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import os
from MapScreen.models import location

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
    
    response = requests.post(url, json = body, headers = headers)
    
    return JsonResponse(response.json())

def all_location(request):
    # trả về dạng list cho place []
    row = location.objects.values(
        'id', 'name', 'latitude', 'longtitude', 'description', "image_path"
    )
    data = []
    for r in row:
        data.append({
            "id": r["id"],
            "name": r["name"],
            "lat": float(r["latitude"]),
            "lon": float(r["longtitude"]),
            "description": r["description"] or "",
            "img": r["image_path"]
        })
    
    return JsonResponse(data, safe = False, json_dumps_params={"ensure_ascii": False})
    
    