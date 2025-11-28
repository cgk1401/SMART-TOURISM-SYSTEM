from django.db import models

class Location(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longtitude = models.FloatField() # longitude btw
    # cho phép để trống cột description, lưu bằng null
    description = models.TextField(blank = True, null = True)
    image_path = models.CharField(max_length = 255, blank = True, default = "")
    tags = models.JSONField(default=dict, blank=True)
    website = models.CharField(max_length=255, blank=True, default="")
    opening_hours = models.CharField(max_length=255, blank=True, default="")
    rating = models.FloatField(default=4.0)
    
