from django.shortcuts import render
import time, requests
from django.http import JsonResponse
import os
from MapScreen.models import Location
from django.views.decorators.csrf import csrf_exempt
import json
from RouteScreen.models import Trip
from django.shortcuts import get_object_or_404



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

    base_location = Location.objects.get(name = base_name)
    limit = int(request.GET.get("limit"))
    
    base_tags = base_location.tags 
    all_location = Location.objects.exclude(pk = base_location.pk)
    
    if not base_tags:
        # nếu địa điểm truyền vào không có tags thì sẽ lấy các tags mặc đinh sau đây
        # tags này của Thảo cầm viên sài gòn
        base_tags = {
            "interest": ["nature"], 
            "budget": "budget", 
            "activity_level": "relaxed", 
            "group_type": "all"
            }
        
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
                # trả về thông tin của các location theo một form
                "score": scores,
                "name": loc.name,
                "lat": loc.latitude,
                "lon": loc.longtitude,
                "rating": loc.rating,
                "address": loc.address,
            })
                

    results.sort(key = lambda x : x["score"], reverse = True)
    
    return JsonResponse(results[:limit], safe = False) 
   
      

def autocomplete_places(request):
    q = request.GET.get("q", "")
    if not q:
        return JsonResponse([], safe=False)
    
    db_results = Location.objects.filter(name__icontains=q)\
        .order_by('-rating')\
        .values("pk", "name", "latitude", "longtitude", "rating", "address")[:5]
    
    formatted_results = []
    for item in db_results:
        print(item["rating"])
        formatted_results.append({
            # trả về một vài thông tin trong db
            "name": item["name"],  
            "lat": item["latitude"],
            "lon": item["longtitude"], 
            "id": item["pk"],
            "address": item["address"],
            # không cần trả tags
        })
    
    return JsonResponse(formatted_results, safe=False)

API_KEY_MAP = os.getenv("API_KEY_MAP") 
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


    
def detailsRoute(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id)
    
    stops = trip.stops.all()
    
    data = {
        "id": trip.id,
        "title": trip.title,
        "description": trip.description,
        "avg_rating": trip.avg_rating,
        "rating_count": trip.rating_count,
        "stops": [
            {
                "order": st.order_index,
                "day": st.day_index,
                "stay": st.stay_minutes,
                "location": {
                    "name": st.location.name,
                    "lat": st.location.latitude,
                    "lon": st.location.longtitude,
                    "address": st.location.address or st.location.name, # check trường hợp lấy db mà không có address
                    "rating": st.location.rating,
                    "tags": st.location.tags,
                }
            } for st in stops
        ]
    }
    return JsonResponse(data)
    
    