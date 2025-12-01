from django.db import models
from django.contrib.auth.models import User


class UserPref(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    interests = models.JSONField(default=list, blank=True)
    eating_habits = models.JSONField(default=list, blank=True)

    group_type = models.CharField(max_length=50, blank=True)
    budget = models.CharField(max_length=50, blank=True)
    activity_level = models.CharField(max_length=50, blank=True)
    visit_duration = models.CharField(max_length=50, blank=True)

    start_time = models.CharField(max_length=10, blank=True, default="")
    end_time = models.CharField(max_length=10, blank=True, default="")