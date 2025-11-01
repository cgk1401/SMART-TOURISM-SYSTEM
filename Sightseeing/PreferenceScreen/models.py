from django.db import models
from django.contrib.auth.models import User


class UserPref(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    interests = models.JSONField(default=list)
    group_types = models.JSONField(default=list)
    activity_levels = models.JSONField(default=list)