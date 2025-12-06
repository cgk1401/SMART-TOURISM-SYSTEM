from django.shortcuts import render, redirect
from django.http import JsonResponse
from RouteScreen.models import Trip
from django.db.models import Count
from django.contrib.auth import logout
import random
from django.shortcuts import get_object_or_404

# Create your views here.

def function_Main(request):
    return render(request, 'app/Main.html')

def logout_user(request):
    logout(request)
    return redirect('/')

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
    
    
from django.db.models import Count, Avg, Max
def getCommunityTrips(request):
    # Lấy danh sách các route_hash duy nhất
    unique_hashes = Trip.objects.exclude(avg_rating = -1).values('route_hash').annotate(
        # Thêm 2 cột mới vào giá trị tính toán trong truy vấn
        total_reviews=Count('id'), # Tổng số bài viết của nhóm này (đếm số người đã đi)
        community_rating=Avg('avg_rating')
    ).order_by('total_reviews', '-community_rating')[:13]
    
    image_pool = [
        "https://images.unsplash.com/photo-1670202602847-09a4f8999054?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8UyVDMyVBMGklMjBnJUMzJUIybnxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8U2FpZ29ufGVufDB8fDB8fHww",
        "https://images.unsplash.com/photo-1555476246-0f72183ae174?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8U2FpZ29ufGVufDB8fDB8fHww",
        "https://images.unsplash.com/photo-1586004551686-d9c4fab26471?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8U2FpZ29ufGVufDB8fDB8fHww",
        "https://images.unsplash.com/photo-1711261727700-2fa12644341e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fFNhaWdvbnxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1705239915648-1aba81d04735?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fFNhaWdvbnxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1521019795854-14e15f600980?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fFNhaWdvbnxlbnwwfHwwfHx8MA%3D%3D",
        "https://media.istockphoto.com/id/2170390329/photo/aerial-view-of-ho-chi-minh-city-skyline-and-skyscrapers-on-saigon-river-center-of-heart.webp?a=1&b=1&s=612x612&w=0&k=20&c=MuGJ45QtGgn5MvfnJb8fppyiBrn4lDS1Cr8_MpNwnME=",
        "https://media.istockphoto.com/id/483210090/photo/saigon-notre-dame-basilica-vietnam.webp?a=1&b=1&s=612x612&w=0&k=20&c=c01Uxb3ax0WTAao_ti28y0FHWEm4x68PYpXn2EO3a2Y=",
        "https://media.istockphoto.com/id/1974607915/photo/ho-chi-minh-city-skyline-skyscrapers-and-the-saigon-river.webp?a=1&b=1&s=612x612&w=0&k=20&c=uLZ0cMh-vtL9UCMRtUyzNe8BPhx9GJabHblDojMHMNs=",
        "https://images.unsplash.com/photo-1536086845112-89de23aa4772?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fFNhaWdvbnxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1586006349021-2244d760f2a3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzV8fFNhaWdvbnxlbnwwfHwwfHx8MA%3D%3D",
        "https://plus.unsplash.com/premium_photo-1734155856872-2048cfd314b2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTI1fHxTYWlnb258ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1592114714621-ccc6cacad26b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGluaCUyMCVDNCU5MSVFMSVCQiU5OWMlMjBsJUUxJUJBJUFEcHxlbnwwfHwwfHx8MA%3D%3D",
    ]
    
    num_trips = len(unique_hashes)
    results = []
    
    if (num_trips > len(image_pool)):
        select_images = random.choices(image_pool, k = num_trips)
    else:
        select_images = random.sample(image_pool, k = num_trips)
        
    for index, item in enumerate(unique_hashes):
        r_hash = item['route_hash']
        representative_trip = Trip.objects.filter(route_hash=r_hash).order_by('-create_at').first()
        results.append({
            "id": representative_trip.id,
            "title": representative_trip.title,
            "description": representative_trip.description,
            "avg_rating": item['community_rating'],
            "rating_count": item['total_reviews'],
            "stop_count": representative_trip.stops.count(),
            "image_url": select_images[index],
            "created_by": representative_trip.owner.username,
        })
    
    return JsonResponse(results, safe=False)
            
        