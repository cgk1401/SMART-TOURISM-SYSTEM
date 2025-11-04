from django.db import models

class location(models.Model):
    name = models.CharField(max_length = 100)
    latitude = models.FloatField()
    longtitude = models.FloatField()
    # cho phép để trống cột descrition, lưu bằng null
    description = models.TextField(blank = True, null = True)
