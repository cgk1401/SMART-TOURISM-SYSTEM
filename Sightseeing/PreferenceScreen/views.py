from django.shortcuts import render, redirect
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import UserPref
from MapScreen.models import Location


def function_preference(request):
    prefs = UserPref.objects.filter(user=request.user)
    start_hours_list = [7,8,9,10,11,12,1,2,3]
    end_hours_list = [12,1,2,3,4,5,6,7,8,9,10,11]
    context = {
        'prefs': prefs,
        'time_start_hours': start_hours_list,
        'time_end_hours': end_hours_list,
    }
    return render(request, 'preference.html', context)

@login_required
def save_preference(request):
    if request.method == "POST":
        interests = request.POST.getlist("interest")  # multiple
        eating = request.POST.getlist("eating_habit")

        group_type = request.POST.get("group_type")
        budget = request.POST.get("budget")
        activity = request.POST.get("activity_level")
        duration = request.POST.get("visit_duration")
        start_hour = request.POST.get("time_start_hour", "")
        start_minute = request.POST.get("time_start_minute", "")
        end_hour = request.POST.get("time_end_hour", "")
        end_minute = request.POST.get("time_end_minute", "")

        start_time_str = f"{start_hour}:{start_minute}" if start_hour and start_minute else ""
        end_time_str = f"{end_hour}:{end_minute}" if end_hour and end_minute else ""

        pref, _ = UserPref.objects.get_or_create(user=request.user)
        pref.interests = interests
        pref.eating_habits = eating
        pref.group_type = group_type or ""
        pref.budget = budget or ""
        pref.activity_level = activity or ""
        pref.visit_duration = duration or ""
        pref.start_time = start_time_str or ""
        pref.end_time = end_time_str or ""
        pref.save()

        options = ranking_loc(pref)
        main_loc = choose_main_loc(pref, options)
        itineraries = build_list(pref, options, main_loc)
        return redirect('/PreferenceScreen/')

    return redirect('/PreferenceScreen/')


def ranking_loc(pref):
    print("User preferences:", pref.interests, pref.group_type, pref.budget)

    if not pref.interests:
        pref.interests = ['sightseeing', 'history', 'entertainment', 'shopping', 'culture', 'nature']
        # for the scoring easier

    locations = Location.objects.all()
    options = []

    WEIGHTS = {
        "rating": 0.55,
        "interest": 0.21,
        "budget": 0.08,
        "activity": 0.08,
        "group": 0.08
    }

    BUDGET_SCORE = {
        "luxury": {"luxury": 1.0, "moderate": 0.7, "budget": 0.4},
        "moderate": {"luxury": 0.1, "moderate": 1.0, "budget": 0.6},
        "budget": {"luxury": -0.7, "moderate": -0.2, "budget": 1.0},
    }

    ACTIVITY_SCORE = {
        "active": {"active": 1.0, "moderate": 0.8, "relaxed": 0.6},
        "moderate": {"active": 0.1, "moderate": 1.0, "relaxed": 0.8},
        "relaxed": {"active": -0.7, "moderate": 0.1, "relaxed": 1.0},
    }

    for loc in locations:
        tags = loc.tags
        loc_interests = tags.get("interest", [])
        loc_budget = tags.get("budget", "")
        loc_activity = tags.get("activity_level", "")
        loc_group = tags.get("group_type", "all")

        if not loc_interests:
            continue

        common = set(loc_interests) & set(pref.interests)
        interest_score = len(common) / max(1, len(pref.interests))
        budget_score = BUDGET_SCORE.get(pref.budget, {}).get(loc_budget, 0)
        activity_score = ACTIVITY_SCORE.get(pref.activity_level, {}).get(loc_activity, 0)
        group_score = 1.0 if loc_group in ("all", pref.group_type) else 0

        score = (
                loc.rating * WEIGHTS["rating"]
                + interest_score * WEIGHTS["interest"]
                + budget_score * WEIGHTS["budget"]
                + activity_score * WEIGHTS["activity"]
                + group_score * WEIGHTS["group"]
        )
        score = round(score, 2)

        """
        print(f"name: {loc.name} \t score: {score}", end="\n")
        print(f"rating: {loc.rating} | "
              f"interest: {interest_score} | "
              f"budget: {budget_score} | "
              f"activity: {activity_score} | "
              f"group: {group_score} \n")
        """

        if score > 0.0:
            options.append({'location':  loc, 'score': score})

    options.sort(key=lambda entry: entry['score'], reverse=True)
    return options


def choose_main_loc(pref, options):
    candidates = []
    top = 15

    for opt in options:
        loc = opt['location']
        name = loc.name.lower()

        if "cgv" in name:
            continue

        amenity = loc.tags.get("amenity", "")
        if amenity in ["pub", "bar"]:
            continue

        # must share at least one interest
        common = set(loc.tags.get("interest", [])) & set(pref.interests)
        if not common:
            continue

        candidates.append(opt)
        if len(candidates) == top:
            break

    # print in shell
    print("Choose centerpiece:")
    for i, opt in enumerate(candidates, 1):
        print(f"{i}. {opt['location'].name} ({opt['score']})")

    # input from shell
    choice = int(input("Enter number: "))
    return candidates[choice-1]['location']


def distance_km(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


def distance_score(dis, activity_level):
    max_score = 10

    # choose min score based on activity
    if activity_level == "relaxed":
        min_score = 3.5
    elif activity_level == "active":
        min_score = 7
    else:
        min_score = 5  # moderate

    # normalize distance (0 → 1)
    d = min(dis / 5.0, 1.0)  # 5 km = max relevant range

    # quadratic decay
    return max_score - (max_score - min_score) * (d ** 2)


def get_duration(loc, user_pref):
    amenity = loc.tags.get("amenity")
    interests = loc.tags.get("interest", [])

    # base
    amenity_duration = {
        "museum": 90,
        "exhibition_centre": 90,
        "theatre": 120,
        "cinema": 120,
        "park": 60,
        "events_venue": 120,
        "marketplace": 60,
        "bar": 45,
        "pub": 45,
        "nightclub": 45,
        "place_of_worship": 45,
        "post_office": 50,
    }

    interest_duration = {
        "history": 75,
        "culture": 75,
        "sightseeing": 60,
        "shopping": 60,
        "entertainment": 90,
        "nature": 60,
    }

    # 1. amenity first
    if amenity in amenity_duration:
        duration = amenity_duration[amenity]
    # 2. if not then interest
    elif interests:
        # take max
        duration = max(
            interest_duration.get(i, 60) for i in interests
        )
    # 3. default
    else:
        duration = 60

    # adjust for user preference
    if user_pref == "brief":
        duration *= 0.55
    elif user_pref == "full_exp":
        duration *= 1.45

    # 5. Clamp range (avoid extremes)
    duration = max(20, min(duration, 150))

    return int(duration)


def build_list(pref, options, main_loc):
    # re-scoring
    for opt in options:
        loc = opt['location']
        dis = distance_km(loc.latitude, loc.longtitude, main_loc.latitude, main_loc.longtitude)
        
        dis_c = distance_score(dis, pref.activity_level)

        old_score = opt['score']
        opt['score'] = 0.7 * old_score + 0.3 * dis_c

    options.sort(key=lambda entry: entry['score'], reverse=True)

    from collections import defaultdict
    buckets = defaultdict(list)

    # split to bucket
    for opt in options:
        ints = opt['location'].tags.get("interest", [])
        if not ints:
            buckets["general"].append(opt)
        else:
            for i in ints:
                buckets[i].append(opt)

    # build the actual lists
    N = 1  # too lazy to change
    LOC_PER = 6

    # init with main_loc
    itineraries = [[main_loc] for _ in range(N)]

    # remove main_loc from buckets
    for b in buckets.values():
        b[:] = [opt for opt in b if opt['location'].pk != main_loc.pk]

    while any(len(it) < LOC_PER for it in itineraries):

        # interest-cycle pass
        for interest in pref.interests:

            bucket = buckets.get(interest, [])
            if not bucket:
                continue

            for i in range(N):
                if len(itineraries[i]) < LOC_PER and bucket:
                    # find the first location in bucket that's not already in the itinerary
                    location_ids_in_itinerary = {loc.pk for loc in itineraries[i]}

                    for j in range(len(bucket)):
                        opt_dict = bucket[j]
                        if opt_dict['location'].pk not in location_ids_in_itinerary:
                            # found a unique location
                            loc = opt_dict['location']
                            loc.tags["duration"] = get_duration(loc, pref.visit_duration)
                            itineraries[i].append(loc)
                            bucket.pop(j)
                            break

            if all(len(it) == LOC_PER for it in itineraries):
                break

        # free-slot pass
        remaining = [loc for bl in buckets.values() for loc in bl]
        if not remaining:
            break

        remaining.sort(key=lambda x: x['score'], reverse=True)

        for i in range(N):
            if remaining and len(itineraries[i]) < LOC_PER:
                # Check for duplicates before adding
                location_ids_in_itinerary = {loc.pk for loc in itineraries[i]}

                for j in range(len(remaining)):
                    opt = remaining[j]
                    if opt['location'].pk not in location_ids_in_itinerary:
                        # Found a unique location, use this one
                        selected_opt = remaining.pop(j)
                        break

                for b in buckets.values():
                    if selected_opt in b:
                        b.remove(selected_opt)
                        break
                loc = selected_opt['location']
                loc.tags["duration"] = get_duration(loc, pref.visit_duration)
                itineraries[i].append(loc)

    return itineraries[0]


def print_itineraries(itineraries):
    import json
    from django.forms.models import model_to_dict

    for loc in itineraries:
        print(json.dumps(model_to_dict(loc), indent=4))


@login_required
def delete_preference(request, pref_id):
    if request.method == "POST":
        pref = get_object_or_404(UserPref, id=pref_id, user=request.user)
        pref.delete()
        return redirect('/PreferenceScreen/')
