from django.db import models
from django.contrib.auth import get_user_model
from MapScreen.models import Location

User = get_user_model()

class Trip(models.Model):
    owner = models.ForeignKey(
        User, on_delete = models.CASCADE,
        related_name = "trips"
    )
    
    title = models.CharField(max_length = 255) #Ten Chuyen Di
    start_date = models.DateField(null = True, blank = True)
    end_date = models.DateField(null = True, blank = True)
    create_at = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now = True)
    description = models.TextField(blank = True)
    # Tạo mã hóa riêng biệt cho từng chuỗi
    route_hash = models.CharField(max_length=64, db_index=True, blank=True, null=True)
    
    # Tổng rating tb
    avg_rating = models.FloatField(default = 0)
    rating_count = models.PositiveIntegerField(default = 0)
    
class TripStop(models.Model):
    trip = models.ForeignKey(
        Trip, on_delete = models.CASCADE,
        related_name = "stops",
    )
    
    location = models.ForeignKey(
        Location, on_delete = models.CASCADE,
        related_name = "trip_stops"
    ) 
    
    day_index = models.PositiveIntegerField(default = 1) # ngày thứ mấy trong trip
    order_index = models.PositiveIntegerField(default = 1) # thứ tự trong ngày
    
    custom_name = models.CharField(
        max_length = 255, blank = True
    ) # có thể đặt tên riêng
    
    note = models.TextField(blank = True)
    
    stay_minutes = models.PositiveIntegerField(null = True, blank = True)
    
    class Meta: 
        ordering = ["day_index", "order_index"]
        
class TripRating(models.Model):
    trip = models.ForeignKey(
        Trip, on_delete = models.CASCADE,
        related_name = "ratings"
    )
    
    user = models.ForeignKey(
        User, on_delete = models.CASCADE,
        related_name = "trip_ratings"
    )
    
    score = models.PositiveSmallIntegerField()
    comment = models.TextField(blank = True)
    created_at = models.DateTimeField(auto_now_add = True)
    
    class Meta:
        unique_together = ("trip", "user")