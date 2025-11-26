from django.shortcuts import render
import time, requests
from django.http import JsonResponse
from django.contrib.auth import logout
import os
from MapScreen.models import location


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

def match_tags(base_tags, other_tags):
    scores = 0
    
    if isinstance(base_tags, list) and isinstance(other_tags, list):
        base_interest = set(base_tags)
        loc_interest = set(other_tags)
        common_interests = base_interest.intersection(loc_interest)
        scores += len(common_interests)
    else:
        scores += (base_tags == other_tags)
    
    return scores

def get_similar_locations(request):
    base_name = request.GET.get("base_location")

    base_location = location.objects.get(name = base_name)
    limit = int(request.GET.get("limit"))
    
    base_tags = base_location.tags 
    all_location = location.objects.exclude(pk = base_location.pk)
    
    results = []
    
    for loc in all_location:
        loc_tags = loc.tags
        scores = 0
        
        for key, base_value_tags in base_tags.items():
            other_value_tags = loc_tags.get(key)
            if other_value_tags is not None:
                scores += match_tags(base_value_tags, other_value_tags)
        if scores > 0:    
            results.append({
                "score": scores,
                "namePlace": loc.name,
                "latitude": loc.latitude,
                "longtitude": loc.longtitude,
                "rating": loc.rating,
                "image": ""
            })
                

    results.sort(key = lambda x : x["score"], reverse = True)
    
    return JsonResponse(results[:limit], safe = False) 
   
      

def autocomplete_places(request):
    q = request.GET.get("q", "")
    if not q:
        return JsonResponse([], safe=False)
    
    db_results = location.objects.filter(name__icontains=q)\
        .order_by('-rating')\
        .values("pk", "name", "latitude", "longtitude", "rating")[:5]
    
    formatted_results = []
    for item in db_results:
        print(item["rating"])
        formatted_results.append({
            "display_name": item["name"],  
            "lat": item["latitude"],
            "lon": item["longtitude"], 
            "id": item["pk"]
        })
    
    return JsonResponse(formatted_results, safe=False)