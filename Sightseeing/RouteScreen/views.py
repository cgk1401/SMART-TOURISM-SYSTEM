from django.shortcuts import render
import time, requests
from django.http import JsonResponse
import os
from MapScreen.models import Location
from django.views.decorators.csrf import csrf_exempt
import json
from RouteScreen.models import Trip
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.contrib.auth import get_user_model
from RouteScreen.models import Trip, TripStop
from MapScreen.models import Location




API_WEATHER_KEY = os.getenv("API_WEATHER_API")

if API_WEATHER_KEY:
    print("yeeee")

def function_Route(request):
    return render(request, 'app/Route.html')

def function_MyTrip(request):
    return render(request, 'app/Mytrip.html')

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
                    "pk": st.location.pk,
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

User = get_user_model()
@csrf_exempt
def Save_Trip(request):
    if request.method != "POST":
        return JsonResponse({"error": "Use POST"}, status=400)
    
    # lấy json từ front end
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
        
    # Lấy user làm chủ trip
    owner = User.objects.filter(is_superuser=True).first() or User.objects.first()
    if not owner:
        return JsonResponse({"error": "No user available"}, status=500)
    
    
    # lấy title từ json
    title = data.get("title") or f"Trip {Trip.objects.filter(owner=owner).count() + 1}"
    # tạo hoặc update trip
    trip, created = Trip.objects.get_or_create(
        title = title,
        owner = owner,
        defaults={
            "description": data.get("description", ""),
            "avg_rating": data.get("avg_rating", 0),
            "rating_count": data.get("rating_count", 1)
        }
    )
    # Nếu trip đã tồn tại, xoá stops cũ
    if not created:
        trip.description = data.get("description", trip.description)
        trip.avg_rating = data.get("avg_rating", trip.avg_rating)
        trip.rating_count = data.get("rating_count", trip.rating_count)
        trip.save()
        trip.stops.all().delete()
    
    stops_data = data.get("stops", [])

    # nếu không có stop thì returnn
    if not stops_data:
        return JsonResponse({
            "status": "EMPTY_STOPS",
            "trip_id": trip.id,
            "message": "Trip được tạo nhưng chưa có điểm dừng nào."
        })
        
    
    # nếu location có rồi (pk đã có) thì cập nhật những trường còn thiếu, insert chứ không ghi đè, còn chưa có location(pk) thì tạo
    for stop in stops_data:
        loc_id = stop.get("pk")
        loc = None
        
        if loc_id:
            loc = Location.objects.filter(pk=loc_id).first()
        
        # xử lý trường hợp đầu vào khi rating rỗng (TH cập nhật địa điểm từ thanh search, OSM không trả về rating)
        input_rating = stop.get("rating")
        if input_rating == "" or input_rating is None:
            input_rating = 4.0
        else:
            input_rating = float(input_rating)
            
        if not loc:
        # trường hợp: Chưa có Location, Tạo mới hoàn toàn
            create_kwargs = {
                "name": stop["name"],
                "latitude": stop["lat"],
                "longtitude": stop["lon"],
                "address": stop.get("address", ""),
                "rating": input_rating,
                "tags": stop.get("tags", {}),
            }
            # Chỉ set pk nếu có giá trị (từ OSM place_id)
            if loc_id:
                create_kwargs["pk"] = loc_id
            
            loc = Location.objects.create(**create_kwargs)
        else:
            # Trường hợp đã có thì update trường rỗng
            updated = False
            if not loc.address and stop.get("address"):
                loc.address = stop.get("address")
                updated = True
            
            # Kiểm tra Tags (Nếu DB chưa có tags hoặc tags rỗng)
            if not loc.tags and stop.get("tags"):
                loc.tags = stop.get("tags")
                updated = True
            
            # Kiểm tra Rating (Ví dụ: nếu DB đang là 0 mà input có rating thì update)
            if (loc.rating is None or loc.rating == 0) and input_rating > 0:
                loc.rating = input_rating
                updated = True

            if updated:
                loc.save()
                
        # 4. Tạo TripStop liên kết Trip và Location
        TripStop.objects.create(
            trip=trip,
            location=loc,
            day_index=1,
            order_index=stop.get("order", 1),
            stay_minutes=stop.get("stay", 30),
        )
        
    return JsonResponse({
        "status": "OK",
        "trip_id": trip.id,
        "message": "Trip saved successfully!"
    })
        
            
        
    
    