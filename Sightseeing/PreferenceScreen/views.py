from django.shortcuts import render, redirect
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import UserPref


def function_preference(request):
    prefs = UserPref.objects.filter(user=request.user)
    return render(request, 'preference.html', {'prefs': prefs})


@login_required
def save_preference(request):
    if request.method == "POST":
        interests = request.POST.getlist("interest")
        group_types = request.POST.getlist("group_type")
        activity_levels = request.POST.getlist("activity_level")

        pref = UserPref(
            user=request.user,
            interests=interests,
            group_types=group_types,
            activity_levels=activity_levels
        )
        pref.save()

        return redirect('/PreferenceScreen/')

    prefs = UserPref.objects.filter(user=request.user)

    return render(request, 'preference.html')


@login_required
def delete_preference(request, pref_id):
    if request.method == "POST":
        pref = get_object_or_404(UserPref, id=pref_id, user=request.user)
        pref.delete()
        return redirect('/PreferenceScreen/')