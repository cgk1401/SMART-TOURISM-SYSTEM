import json
import os
from django.core.management.base import BaseCommand
from RouteScreen.models import Trip, TripStop
from MapScreen.models import Location
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Load default trips from JSON file into DB"
    
    def handle(self, *args, **options):
        json_path = os.path.join(settings.BASE_DIR, "RouteScreen", "fixtures", "default_trips.json")
        
        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR("default_trips.json not found"))
            return
        
        with open(json_path, "r", encoding = "utf-8") as f:
            trips_data = json.load(f)
        
        owner_user = User.objects.filter(is_superuser=True).first()
        if not owner_user:
            owner_user = User.objects.first()
            
        if not owner_user:
            self.stdout.write(self.style.ERROR("Database chưa có User nào. Hãy tạo user hoặc chạy 'createsuperuser' trước."))
            return
        
        for trip_data in trips_data:
            trip, created = Trip.objects.get_or_create(
                title = trip_data["title"],
                owner = owner_user,
                defaults = {
                    "description": trip_data.get("description", ""),
                    "avg_rating": trip_data.get("avg_rating", 5.0),
                    # nếu không truyền vào số người đánh giá thì lưu mặc định là 1, căn bản mỗi lần lưu thì cũng có một người lưu
                    "rating_count": trip_data.get("rating_count", 1),
                }
            )
            
            if not created:
                # nếu trip bị trùng (người khác cùng tạo lộ trình như vậy hoặc sử dụng lại lộ trình đã có sẵn (check trùng tên lộ trình))
                trip.avg_rating = trip_data.get("avg_rating", trip.avg_rating)
                trip.rating_count = trip_data.get("rating_count", trip.rating_count)
                trip.save()
                trip.stops.all().delete()
            
            for stop in trip_data["stops"]:
                loc_id = stop.get("pk")
                
                if not loc_id:
                    print("Thieu ID de luu route")
                    continue
                
                # location nào chưa có thì tạo, location nào đã có rồi thì update những trường dữ liệu chưa có(rỗng hoặc null)
                try:   
                    loc = Location.objects.get(pk = loc_id)
                    # update những trường chưa có dữ liệu
                    # check hết những trường của location trong db
                    updated = False
                    if not loc.name:
                        loc.name = stop["name"]
                        updated = True
                    if not loc.latitude:
                        loc.latitude = stop["lat"]
                        updated = True
                    if not loc.longtitude:
                        loc.longtitude = stop["lon"]
                        updated = True
                    if not loc.address:
                        loc.address = stop.get("address", "")
                        updated = True
                    if not loc.rating:
                        loc.rating = stop.get("rating", 4.0)
                        updated = True
                    if not loc.tags:
                        loc.tags = stop.get("tags", {})
                        updated = True
                    if updated:
                        loc.save()
                    
                except Location.DoesNotExist:
                    # chưa có location thì tạo
                    loc = Location.objects.create(
                        pk=loc_id,
                        name=stop["name"],
                        latitude=stop["lat"],
                        longtitude=stop["lon"],
                        address=stop.get("address", ""),
                        rating=stop.get("rating", 4.0),
                        tags=stop.get("tags", {})
                    )
                    
                
                TripStop.objects.create(
                    trip = trip,
                    location = loc,
                    day_index = 1,
                    order_index=stop["order"],
                    stay_minutes = stop.get("stay", 15)
                )
            
            self.stdout.write(self.style.SUCCESS(f"Done trip: {trip.title}"))
                