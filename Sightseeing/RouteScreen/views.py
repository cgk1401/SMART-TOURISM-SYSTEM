from django.shortcuts import render
import time, requests
from django.http import JsonResponse
from django.contrib.auth import logout
import os


API_WEATHER_KEY = os.getenv("API_WEATHER_API")

if API_WEATHER_KEY:
    print("yeeee")

def function_Route(request):
    return render(request, 'app/Route.html')

NOMINATIM = "https://nominatim.openstreetmap.org"
UA = {"User-Agent": "OSM-Demo-Geocode/1.0 (contact: doomanhcuongg@gmail.com)"}

OVERPASS = "https://overpass.kumi.systems/api/interpreter"

def geocode(request):
    q = request.GET.get("q", "")
    if not q:
        return JsonResponse({
            "error": "Missing",
        }, status = 400)
    time.sleep(1.0)
    r = requests.get(f"{NOMINATIM}/search", params={
        "q": q, "format": "jsonv2", "limit": 1, "addressdetails": 1
    }, headers=UA, timeout=60)
    r.raise_for_status()
    data = r.json()
    if not data: raise ValueError("Không tìm thấy kết quả")
    item = data[0]
    # print("Query:", q)
    # print("Lat/Lon:", item["lat"], item["lon"])
    # print("Display name:", item.get("display_name"))
    return JsonResponse(item, safe = False, json_dumps_params = {"ensure_ascii": False})


def get_current_city_weather_from_location(lat: float, lon: float) -> dict:
    url = "https://api.openweathermap.org/data/2.5/weather"
    
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_WEATHER_KEY,
        "units": "metric",
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    return data


def get_weather(request):
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")

    if not lat or not lon:
        return JsonResponse({"error": "Missing lat/lon"}, status=400)

    data = get_current_city_weather_from_location(lat, lon)
    
    
    return JsonResponse(data, safe=False)

