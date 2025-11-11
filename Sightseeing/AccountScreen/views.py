from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from .models import Profile  # ← ADD THIS LINE
import json


# Minimal account views for AccountScreen app.
# - index: small dashboard / account home
# - profile: view current user's profile
# - update_profile: accept POST to update basic fields (first_name, last_name, email)
# - history: render user's history page (if available)


@login_required
def index(request):
    """Account landing page."""
    user = request.user
    user_data = {
        'name': f"{user.first_name} {user.last_name}" if user.first_name or user.last_name else user.username,
        'email': user.email if user.email else "Not set",
        'username': user.username
    }
    # Convert to JSON string
    user_data_json = json.dumps(user_data)
    return render(request, 'app/account.html', {'user_data_json': user_data_json})


# Note: `profile.html` is not required per request, so the `profile` view
# has been removed. Use `index` as the canonical account landing page.


@login_required
@require_http_methods(["POST"])
def update_profile(request):
	"""Handle POSTed profile updates (first_name, last_name, email).

	This is intentionally simple: no file uploads, no password change. It
	validates minimal fields and redirects back to the profile page with a message.
	"""
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

	# Redirect back to the account index (no separate profile page required).
	return redirect('AccountScreen:index')


@login_required
@require_http_methods(["POST"])
def update_avatar(request):
	"""Handle avatar upload."""
	if 'avatar' in request.FILES:
		avatar = request.FILES['avatar']
		# Note: This requires a Profile model with avatar field
		# For now, we'll just return success
		# TODO: Implement profile model and avatar storage
		return JsonResponse({'status': 'success', 'message': 'Avatar updated'})
	return JsonResponse({'status': 'error', 'message': 'No file provided'}, status=400)


@login_required
def history(request):
    """Render a history page with trip history data."""
    # TODO: In the future, this should query from a real Trip model
    # For now we'll use sample data structured like the frontend expects
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
