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
            
            for stop in trip_data["stops"]:
                loc_id = stop.get("pk")
                
                if not loc_id:
                    print("Thieu ID de luu route")
                    continue
                
                loc, loc_created = Location.objects.update_or_create(
                    pk = loc_id,
                    defaults = {
                        "name": stop["name"],
                        "latitude": stop["lat"],
                        "longtitude": stop["lon"],
                        "address": stop.get("address", ""),
                        
                        # Hiện tại chưa crawl được rating, nên sẽ gán mặc định
                        "rating": stop.get("rating", 4.0),
                        # Hiện tại cũng chưa crawl được tag nên sẽ để trống
                        "tags": stop.get("tags", {}),
                        
                        # đã có hàm tự gắn rating và tags trong logic (tự xử lý)
                    }
                )
                
                TripStop.objects.create(
                    trip = trip,
                    location = loc,
                    day_index = 1,
                    order_index=stop["order"],
                    stay_minutes = stop.get("stay", 15)
                )
            
            self.stdout.write(self.style.SUCCESS(f"Done trip: {trip.title}"))
                