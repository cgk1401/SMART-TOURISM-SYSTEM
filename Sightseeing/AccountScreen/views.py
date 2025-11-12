from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from .models import Profile
import json


# Minimal account views for AccountScreen app.
# - account_view: handles account display, user data JSON preparation, and avatar upload
# - update_profile: accept POST to update basic fields (first_name, last_name, email)
# - history: render user's history page (if available)


# @login_required
# def index(request): # <-- ĐÃ BỊ XÓA
#     # ... Logic index cũ đã được chuyển sang account_view
#     pass


@login_required
@require_http_methods(["POST"])
def update_profile(request):
    """Handle POSTed profile updates (first_name, last_name, email)."""
    first_name = request.POST.get('first_name', '').strip()
    last_name = request.POST.get('last_name', '').strip()
    email = request.POST.get('email', '').strip()

    user = request.user
    changed = False

    if first_name and first_name != user.first_name:
        user.first_name = first_name
        changed = True

    if last_name and last_name != user.last_name:
        user.last_name = last_name
        changed = True

    if email and email != user.email:
        user.email = email
        changed = True

    if changed:
        user.save()
        messages.success(request, 'Profile updated successfully.')
    else:
        messages.info(request, 'No changes detected.')

    # Redirect back to the canonical account index page ('account' name should be used now)
    return redirect('AccountScreen:account') # CHỈNH SỬA: Chuyển hướng đến 'account' thay vì 'index'


@login_required
def history(request):
    """Render a history page with trip history data."""
    # TODO: In the future, this should query from a real Trip model
    trip_history = [
        {
            'id': 1,
            'date': "2024-12-15",
            'totalPlaces': 3,
            'duration': "4 hrs",
            'places': [
                {'name': "Notre-Dame Cathedral", 'location': "District 1"},
                {'name': "Ben Thanh Market", 'location': "District 1"},
                {'name': "War Remnants Museum", 'location': "District 3"}
            ]
        },
        {
            'id': 2,
            'date': "2024-11-02", 
            'totalPlaces': 2,
            'duration': "3 hrs",
            'places': [
                {'name': "Bitexco Financial Tower", 'location': "District 1"},
                {'name': "Saigon Central Post Office", 'location': "District 1"}
            ]
        }
    ]
    return render(request, 'app/history.html', {'trip_history': trip_history})


@login_required
def account_view(request):
    """
    Handles both account display (GET) and avatar upload (POST).
    This view replaces the functionality of the old 'index' view.
    """
    user = request.user
    # 1. Create profile if not exists
    Profile.objects.get_or_create(user=user)

    # 2. Handle Avatar Upload (POST request)
    if request.method == 'POST' and 'avatar' in request.FILES:
        request.user.profile.avatar = request.FILES['avatar']
        request.user.profile.save()
        messages.success(request, 'Avatar updated!')
        # CHỈNH SỬA: Dùng 'AccountScreen:account' để đảm bảo chuyển hướng đúng
        return redirect('AccountScreen:account') 

    # 3. Prepare User Data for Template (GET request or after POST)
    user_data = {
        'name': f"{user.first_name} {user.last_name}" if user.first_name or user.last_name else user.username,
        'email': user.email if user.email else "Not set",
        'username': user.username
    }
    user_data_json = json.dumps(user_data)
    
    # 4. Render the page
    return render(request, 'app/account.html', {'user_data_json': user_data_json})


@login_required
def history_view(request):
    # CHÚ Ý: View này có vẻ dư thừa vì bạn đã có view 'history' ở trên.
    # Nếu bạn giữ cả hai, hãy đảm bảo chỉ có một được sử dụng trong urls.py.
    return render(request, 'app/history.html')