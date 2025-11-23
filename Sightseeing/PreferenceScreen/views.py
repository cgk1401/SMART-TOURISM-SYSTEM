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
        interests = request.POST.getlist("interest")  # multiple
        eating = request.POST.getlist("eating_habit")

        group_type = request.POST.get("group_type")
        budget = request.POST.get("budget")
        activity = request.POST.get("activity_level")

        pref, _ = UserPref.objects.get_or_create(user=request.user)
        pref.interests = interests
        pref.group_types = [group_type] if group_type else []
        pref.budgets = [budget] if budget else []
        pref.activity_levels = [activity] if activity else []
        pref.eating_habits = eating
        pref.save()

        return redirect('/PreferenceScreen/')

    return redirect('/PreferenceScreen/')


@login_required
def delete_preference(request, pref_id):
    if request.method == "POST":
        pref = get_object_or_404(UserPref, id=pref_id, user=request.user)
        pref.delete()
        return redirect('/PreferenceScreen/')