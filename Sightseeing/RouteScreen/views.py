from django.shortcuts import render
import time, requests
from django.http import JsonResponse, HttpResponseBadRequest
import os
from MapScreen.models import Location
from django.views.decorators.csrf import csrf_exempt
import json
from RouteScreen.models import Trip
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.contrib.auth import get_user_model
from RouteScreen.models import Trip, TripStop, TripRating
from django.db.models import Avg, Count
from MapScreen.models import Location
from django.db import transaction
from django.contrib.auth.decorators import login_required
from functools import lru_cache
import math
import sys

API_WEATHER_KEY = os.getenv("API_WEATHER_API")
OSRM_HOST = "http://router.project-osrm.org"
REQUEST_TIMEOUT = 30 
NOMINATIM_TIMEOUT = 5

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

    #base_location = Location.objects.get(name = base_name)
    base_location = Location.objects.filter(name=base_name).first()
    
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

SAMPLE_LOCATIONS = [
    {
    "id": 39598493,
    "name": "Dinh Độc Lập",
    "latitude": 10.777017,
    "longtitude": 106.6954031,
    "description": "",
    "image_path": "",
    "tags": {
        "interest": [
            "history",
            "sightseeing"
        ],
        "budget": "budget",
        "activity_level": "moderate",
        "group_type": "all"
    },
    "website": "",
    "opening_hours": "Mo-Su 08:00-11:00,13:00-16:30",
    "rating": 9.66
},
{
    "id": 186249226,
    "name": "Bảo tàng Chứng tích Chiến tranh",
    "latitude": 10.7793793,
    "longtitude": 106.6921923,
    "description": "",
    "image_path": "",
    "tags": {
        "amenity": "museum",
        "interest": [
            "history",
            "culture",
            "sightseeing"
        ],
        "budget": "budget",
        "activity_level": "moderate",
        "group_type": "all",
        "duration": 130
    },
    "website": "https://www.baotangchungtichchientranh.vn/contact.html",
    "opening_hours": "Mo-Su 07:30-12:00, 13:30-17:00",
    "rating": 9.45
},
{
    "id": 808022726,
    "name": "Bảo tàng Hồ Chí Minh",
    "latitude": 10.7682684,
    "longtitude": 106.7068035,
    "description": "",
    "image_path": "",
    "tags": {
        "amenity": "museum",
        "interest": [
            "history",
            "culture",
            "sightseeing"
        ],
        "budget": "budget",
        "activity_level": "moderate",
        "group_type": "all",
        "duration": 130
    },
    "website": "",
    "opening_hours": "Mo,Fr 08:00-12:00; Tu-Th,Sa,Su 08:00-12:00,14:00-16:30",
    "rating": 8.4
},
{
    "id": 39514795,
    "name": "Chợ Bến Thành",
    "latitude": 10.7725707,
    "longtitude": 106.6980174,
    "description": "",
    "image_path": "",
    "tags": {
        "amenity": "marketplace",
        "interest": [
            "sightseeing"
        ],
        "budget": "budget",
        "activity_level": "relaxed",
        "group_type": "all",
        "duration": 87
    },
    "website": "https://benthanhmarket.vn/",
    "opening_hours": "Mo-Su 06:00-18:00",
    "rating": 9.66
},
{
    "id": 39514793,
    "name": "Bưu điện Trung tâm Sài Gòn",
    "latitude": 10.7799812,
    "longtitude": 106.7000211,
    "description": "",
    "image_path": "",
    "tags": {
        "amenity": "post_office",
        "interest": [
            "history",
            "sightseeing"
        ],
        "budget": "budget",
        "activity_level": "relaxed",
        "group_type": "all",
        "duration": 72
    },
    "website": "",
    "opening_hours": "Mo-Su 07:00-22:00",
    "rating": 9.03
},
{
    "id": 9587486349,
    "name": "Chùa Phụng Sơn",
    "latitude": 10.7664477,
    "longtitude": 106.6983992,
    "description": "",
    "image_path": "",
    "tags": {
        "amenity": "place_of_worship",
        "interest": [
            "culture",
            "sightseeing"
        ],
        "activity_level": "relaxed",
        "group_type": "all",
        "duration": 65
    },
    "website": "",
    "opening_hours": "",
    "rating": 8.27
},
]


def call_osrm_route(lat1, lon1, lat2, lon2):
    try:
        coords = f"{lon1},{lat1};{lon2},{lat2}"
        url = f"{OSRM_HOST}/route/v1/driving/{coords}"
        params = {
            "overview": "full",
            "annotations": "distance,duration",
            "alternatives": "false",
            "steps": "false"
        }
        
        resp = requests.get(url, params=params, timeout=REQUEST_TIMEOUT) 
        resp.raise_for_status()
        data = resp.json()
        
        if 'routes' not in data or len(data['routes']) == 0:
            raise ValueError("No routes found.")
            
        route = data['routes'][0]
        return {
            "distance_m": route.get('distance', 0),
            "duration_s": route.get('duration', 0)
        }
    except requests.exceptions.Timeout:
         raise Exception(f"timeout error again and again: {REQUEST_TIMEOUT}")
    except Exception as e:
        raise Exception(f"error calling api: {e}")

def estimate_route(lat1, lon1, lat2, lon2):
    r = call_osrm_route(lat1, lon1, lat2, lon2)
    distance_km = r["distance_m"] / 1000.0
    duration_minutes = r["duration_s"] / 60.0
    return [distance_km, duration_minutes]

@lru_cache(maxsize=None)
def cached_segment(lat1, lon1, lat2, lon2):
    return estimate_route(float(lat1), float(lon1), float(lat2), float(lon2))



@lru_cache(maxsize=1000) 
def get_address_from_coords(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1,
        "zoom": 18,
        "accept-language": "vi",
    }
    headers = {
        "User-Agent": "route-optimizer-app-v1-dev" 
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=NOMINATIM_TIMEOUT) 
        r.raise_for_status()
        data = r.json()
        return data.get('display_name', 'no addr found')
    except Exception as e:
        return "Addr error"

def tsp_nearest_neighbor(matrix):
    n = len(matrix)
    visited = [False] * n
    route = [0]
    visited[0] = True

    for _ in range(1, n):
        last = route[-1]
        next_idx = None
        min_time = float('inf')
        for j in range(n):
            if not visited[j] and matrix[last][j] < min_time:
                min_time = matrix[last][j]
                next_idx = j
        
        if next_idx is not None:
            route.append(next_idx)
            visited[next_idx] = True
        else:
            break
            
    return route


def format_location_data(input_location_dict, order_index):
    lat_val = input_location_dict.get("latitude")
    lon_val = input_location_dict.get("longtitude")
    
    address_string = "No coords"
    
    if lat_val is not None and lon_val is not None:
        try:
            address_string = get_address_from_coords(float(lat_val), float(lon_val))
        except Exception:
             address_string = "api error ;-;"

    final_object = {
        "pk": input_location_dict.get("id"), 
        "name": input_location_dict.get("name"),           
        "address": address_string,                      
        "lat": lat_val,                             
        "lon": lon_val,                     
        "order": order_index + 1,                    
        "stay": 30,                          
        "tags": input_location_dict.get("tags"),
    }
    
    return final_object


def compute_route_from_indices(original_locations_dict, matrix, route_indices):
    if not route_indices:
        return {
            "formatted_locations": [],
            "total_distance_km": 0.0,
            "total_duration_min": 0.0,
        }
        
    total_d = 0.0
    total_t = 0.0
    formatted_locations = []
    for i in range(len(route_indices) - 1):
        a = route_indices[i]
        b = route_indices[i+1]
        
        dist, dur = matrix[a][b]
        total_d += dist
        total_t += dur

    for i, idx in enumerate(route_indices):
        current_location_dict = original_locations_dict[idx]
        
        formatted_obj = format_location_data(current_location_dict, i)
        
        formatted_locations.append(formatted_obj)

    return {
        "formatted_locations": formatted_locations,
        "total_distance_km": total_d,
        "total_duration_min": total_t,
    }

def format_final_response(formatted_stops):
    return {
        "title": "",
        "description": "",
        "stops": formatted_stops,    
    }


def index(request):
    return render(request, 'route_map.html', {})

def route_json(request):
    lat1 = request.GET.get("lat1")
    lon1 = request.GET.get("lon1")
    lat2 = request.GET.get("lat2")
    lon2 = request.GET.get("lon2")
    
    try:
        dist, dur = cached_segment(float(lat1), float(lon1), float(lat2), float(lon2))
        return JsonResponse({
            "distance_km": round(dist, 2),
            "duration_min": round(dur, 2)
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def total_route_view(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("need POST.")

    try:
        data = json.loads(request.body)
        locations_coords_list = data.get("locations")
        if not locations_coords_list or not isinstance(locations_coords_list, list):
            raise ValueError("no location or format error.")
            
        total_d = 0.0
        total_t = 0.0
        
        n = len(locations_coords_list)
        if n < 2:
            return JsonResponse({"total_distance_km": 0, "total_duration_min": 0})
            
        for i in range(n - 1):
            lat1, lon1 = locations_coords_list[i]
            lat2, lon2 = locations_coords_list[i+1]
            
            dist, dur = cached_segment(float(lat1), float(lon1), float(lat2), float(lon2))
            total_d += dist
            total_t += dur

        return JsonResponse({
            "total_distance_km": round(total_d, 2),
            "total_duration_min": round(total_t, 2)
        })

    except Exception as e:
        return HttpResponseBadRequest("Data error: " + str(e))


def optimize_route_fast_view(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("require POST and JSON Body.")

    try:
        data = json.loads(request.body)
        locations_dict = data.get("locations")
    except json.JSONDecodeError:
        return HttpResponseBadRequest("json in request body need to check again.")
    except Exception as e:
        return HttpResponseBadRequest("request error: " + str(e))


    if not locations_dict or not isinstance(locations_dict, list):
        return HttpResponseBadRequest("location error.")

    locations_coords = []
    try:
        for d in locations_dict:
            lat = d['latitude']
            lon = d['longtitude']
            locations_coords.append((float(lat), float(lon)))
    except (KeyError, TypeError, ValueError) as e:
        return HttpResponseBadRequest(f"lat and lon error.")

    n = len(locations_coords)
    if n < 2:
        return HttpResponseBadRequest("At least 2.")

    matrix = [[(0.0, 0.0)]*n for _ in range(n)]
    nn_matrix = [[float('inf')]*n for _ in range(n)] 

    try:
        for i in range(n):
            for j in range(n):
                if i != j:
                    lat1, lon1 = locations_coords[i]
                    lat2, lon2 = locations_coords[j]
                    
                    dist, dur = cached_segment(lat1, lon1, lat2, lon2)
                    
                    matrix[i][j] = (dist, dur)
                    nn_matrix[i][j] = dur
    except Exception as e:
        return JsonResponse({"error": "Connection or api error: " + str(e)}, status=500)


    route_indices = tsp_nearest_neighbor(nn_matrix)

    result = compute_route_from_indices(locations_dict, matrix, route_indices)

    final_output = format_final_response(result["formatted_locations"])
    
    final_output["summary"] = {
        "total_distance_km": round(result["total_distance_km"], 2),
        "total_duration_min": round(result["total_duration_min"], 2)
    }

    return JsonResponse(final_output)


def test_optimize_route_view(request):
    """
    Demo endpoint (using SAMPLE_LOCATIONS).
    """
    locations_dict = request.session["itinerary_data"]
    
    n = len(locations_dict)
    if n < 2:
        return JsonResponse({"error": "Too short bro"}, status=400)

    locations_coords = []
    try:
        for d in locations_dict:
            locations_coords.append((float(d['latitude']), float(d['longtitude'])))
    except (KeyError, TypeError, ValueError) as e:
        return JsonResponse({"error": f"format is error: {e}"}, status=500)

    matrix = [[(0.0, 0.0)]*n for _ in range(n)]
    nn_matrix = [[float('inf')]*n for _ in range(n)] 

    try:
        for i in range(n):
            for j in range(n):
                if i != j:
                    lat1, lon1 = locations_coords[i]
                    lat2, lon2 = locations_coords[j]
                    
                    dist, dur = cached_segment(lat1, lon1, lat2, lon2)
                    
                    matrix[i][j] = (dist, dur)
                    nn_matrix[i][j] = dur
    except Exception as e:
        return JsonResponse({"error": "Connection or api error: " + str(e)}, status=500)

    route_indices = tsp_nearest_neighbor(nn_matrix)

    result = compute_route_from_indices(locations_dict, matrix, route_indices)

    final_output = format_final_response(result["formatted_locations"])
    
    
    #final_output["summary"] = {
    #    "total_distance_km": round(result["total_distance_km"], 2),
    #    "total_duration_min": round(result["total_duration_min"], 2)
    #}

    return JsonResponse(final_output)
    
User = get_user_model()
@csrf_exempt
@login_required
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
    
    
    stops_data = data.get("stops", [])
    if not stops_data:
        return JsonResponse({
            "status": "EMPTY_STOPS",
            "message": "Chưa có điểm dừng nào"
        })

    try:
        with transaction.atomic():
            # Luôn tạo một trip mới với rating là -1 để đánh dấu, vô phần My trip để chỉnh sửa, tên có thể có hoặc lấy theo thời gian tạo
            trip = Trip.objects.create(
                owner = request.user,
                title = data.get("title") or f"Draft Trip{int(time.time())}",
                description = data.get("description", ""),
                avg_rating = -1 ,# đánh dấu
                rating_count = 0, # lưu nhưng chưa rating nên sẽ để là 0 để đánh dấu
            )
        
    
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
                    # không cần check trường hợp lat, lon
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
                    
                # Tạo TripStop liên kết Trip và Location
                TripStop.objects.create(
                    trip=trip,
                    location=loc,
                    day_index=1,
                    order_index=stop.get("order", 1),
                    stay_minutes=stop.get("stay", 30),
                )
    except Exception as e:
        print(e)
        
    return JsonResponse({
        "status": "OK",
        "trip_id": trip.id,
        "message": "Trip saved successfully!"
    })
        
            
@login_required 
def getUnsavedTrips(request):
    # chỉ lấy đúng trip của mình, không lấy trip của người khác
    trips = Trip.objects.filter(owner=request.user, avg_rating=-1).order_by('-create_at')
    
    results = []
    
    for trip in trips:
        stops = trip.stops.all().order_by('day_index', 'order_index')
        
        date_str = ""
        if trip.create_at:
            date_str = trip.create_at.strftime("%d/%m/%Y")
        
        results.append({
            "id": trip.id,
            "title": trip.title,
            "description": trip.description,
            "avg_rating": trip.avg_rating,
            "rating_count": trip.rating_count,
            "created_at": date_str, # Thêm trường này để hiển thị ngày
            "stops": [
                {
                    "order": st.order_index,
                    "day": st.day_index,
                    "stay": st.stay_minutes,
                    "note": st.note, # Thêm note nếu user muốn sửa note
                    "location": {
                        "pk": st.location.pk,
                        "name": st.location.name,
                        "lat": st.location.latitude,
                        "lon": st.location.longtitude,
                        "address": st.location.address or st.location.name,
                        "rating": st.location.rating,
                        "tags": st.location.tags,
                    }
                } for st in stops
            ]
        })
    return JsonResponse(results, safe=False)

@login_required
def getAllTrips(request):
    # tương tự cũng lấy trip của mình không lấy trip của người khác
    trips = Trip.objects.filter(owner=request.user).exclude(avg_rating=-1).order_by('-create_at')
    
    results = []
    
    for trip in trips:
        stops = trip.stops.all().order_by('day_index', 'order_index')
        
        date_str = ""
        if trip.create_at:
            date_str = trip.create_at.strftime("%d/%m/%Y")
        
        results.append({
            "id": trip.id,
            "title": trip.title,
            "description": trip.description,
            "avg_rating": trip.avg_rating,
            "rating_count": trip.rating_count,
            "created_at": date_str, # Thêm trường này để hiển thị ngày
            "stops": [
                {
                    "order": st.order_index,
                    "day": st.day_index,
                    "stay": st.stay_minutes,
                    "note": st.note, # Thêm note nếu user muốn sửa note
                    "location": {
                        "pk": st.location.pk,
                        "name": st.location.name,
                        "lat": st.location.latitude,
                        "lon": st.location.longtitude,
                        "address": st.location.address or st.location.name,
                        "rating": st.location.rating,
                        "tags": st.location.tags,
                    }
                } for st in stops
            ]
        })
    return JsonResponse(results, safe=False)


@csrf_exempt
@login_required
def Update_Trip(request):
    if request.method != "POST":
        return JsonResponse({"error": "Use POST"}, status=400)
    
    try:
        data = json.loads(request.body)
        trip_id = data.get("trip_id")
        # tìm chuyến đi theo ID
        
        # đảm bảo chỉ update trip của chính minh
        trip = get_object_or_404(Trip, id=trip_id, owner=request.user)
        
        # Cập nhật thông tin người dùng
        if "title" in data:
            trip.title = data["title"]
        
        if "description" in data:
            trip.description = data["description"]
       
        # cập nhật rating
        input_rating = data.get("rating")
        if input_rating and int(input_rating) > 0:
            score_val = int(input_rating)
            
            TripRating.objects.update_or_create(
                trip= trip,
                user = request.user,
                defaults={
                    'score': score_val,
                    'comment': data.get("description", "") # Lưu mô tả vào comment đánh giá luôn
                }
            )
            stats = TripRating.objects.filter(trip=trip).aggregate(
                avg_score=Avg('score'),
                total_reviews=Count('id')
            )
            trip.avg_rating = stats['avg_score'] or score_val
            trip.rating_count = stats['total_reviews'] or 1
            
        trip.save()
        
        # sau khi update xong thì xử lý lại các trip nếu bị trùng, chỉ mới xử lý trường hợp trùng của cùng một user
        merge_duplicate_trips(trip)
            
        return JsonResponse({
            "status": "OK",
            "message": "Cập nhật chuyến đi thành công!"
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
from django.db.models.functions import Lower
def trip_signature(trip):
    # check trùng theo tọa độ các điểm trong trip
    sig = []
    for st in trip.stops.order_by("day_index", "order_index"):
        lat = round(st.location.latitude, 6)
        lon = round(st.location.longtitude, 6)
        sig.append((lat, lon))
    return tuple(sig)

def merge_duplicate_trips(trip):
    # merge các trip bị trùng (hiện tại chỉ check cùng một user)
    # lấy tất cả các trip, trừ trip hiện tại
    candidates = (
        Trip.objects
        .filter(owner=trip.owner)
        .exclude(pk=trip.pk)
    )
    print(candidates)
    # nếu tồn tại trip khác (chỉ có một trip) thì return
    if not candidates.exists():
        return
    
    base_sig = trip_signature(trip)
    duplicate_trips = []
    
    # check trùng trip
    for t in candidates:
        if trip_signature(t) == base_sig:
            duplicate_trips.append(t)
            
    if not duplicate_trips:
        return
    
    dup_ids = [t.pk for t in duplicate_trips]
    
    with transaction.atomic():
        
        # lưu đè bởi trip mới nhất
        
        
        # xóa trip trùng
        Trip.objects.filter(pk__in=dup_ids).delete()
        stats = TripRating.objects.filter(trip=trip).aggregate(
            avg_score=Avg('score'),
            total_reviews=Count('id')
        )
        trip.avg_rating = stats['avg_score'] or 0
        trip.rating_count = stats['total_reviews'] or 0
        trip.save()
