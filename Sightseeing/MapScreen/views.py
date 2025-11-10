from django.shortcuts import render
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import os
from MapScreen.models import location
from math import radians, sin, cos, asin, sqrt

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

def haversine_km(lat1, lon1, lat2, lon2):
    # tính khoảng cách giữa hai điểm
    R = 6371 # bk trái đất
    # chuyển sang radian
    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)
    
    distance_lat = lat2 - lat1
    distance_lon = lon2 - lon1
    
    a = sin(distance_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(distance_lon / 2) ** 2
    return R * 2 * asin(sqrt(a))

def all_location(request):
    near_id = request.GET.get("near_id")
    r_km = float(request.GET.get("r_km"))
    limit = int(request.GET.get("limit", 30))
    
    if near_id is not None:
        # trường hợp đi theo điểm mặc định có trong db
        center = location.objects.get(pk = int(near_id))
        near_lat = float(center.latitude)
        near_lon = float(center.longtitude)
    
        
    # lọc trước 
    dlat = r_km / 111.0
    dlon = r_km / (111.0 * max(0.1, cos(radians(near_lat))))
    qs = location.objects.filter(
        latitude__range=(near_lat - dlat, near_lat + dlat),
        longtitude__range=(near_lon - dlon, near_lon + dlon),
    )
    
    items = []
    for o in qs :
        distance = haversine_km(near_lat, near_lon, float(o.latitude), float(o.longtitude))
        
        if distance <= r_km and (not center or o.id != center.id):
            items.append((distance, o))
            
    items.sort()
    items = items[:limit]
    
    data = []
    for a, b in items:
        data.append({
            "id": b.id,
            "name": b.name,
            "lat": b.latitude,
            "lon": b.longtitude,
            "description": b.description or "",
            "img": b.image_path
        })
    return JsonResponse(data, safe = False, json_dumps_params = {"ensure_ascii": False})
    
    
    
    
        
        
    
    