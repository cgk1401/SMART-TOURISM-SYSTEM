from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, HttpResponseBadRequest
from .models import Profile
import json
from datetime import datetime


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
    Handles account display (GET), avatar upload (POST form-data), 
    and general profile updates (POST JSON via AJAX).
    """
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)

    # --- 1. Xử lý yêu cầu POST ---
    if request.method == 'POST':
        
        # A. Xử lý Avatar Upload (form-data)
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
            profile.save()
            messages.success(request, 'Avatar updated!')
            return redirect('AccountScreen:account')
        
        # B. Xử lý Cập nhật Thông tin AJAX (JSON)
        try:
            # Nếu không phải là form-data, giả định là JSON từ AJAX
            data = json.loads(request.body)
        except json.JSONDecodeError:
            # Nếu không phải JSON hợp lệ, có thể là lỗi hoặc POST form khác
            # Trường hợp này có thể xảy ra nếu bạn cố gắng dùng POST form cho update_profile
            return HttpResponseBadRequest("Invalid JSON or unsupported content type.")
        
        
        changed_fields = []
        
        # Lặp qua các trường được gửi đến
        for field, value in data.items():
            
            # Xử lý giá trị 'Not set' thành None/trống
            new_value = value.strip() if isinstance(value, str) else value
            new_value = None if new_value == 'Not set' or new_value == '' else new_value
            
            is_user_field = field in ['email', 'first_name', 'last_name']
            is_profile_field = field in ['phone_number', 'address', 'date_of_birth']

            if is_user_field:
                if getattr(user, field) != new_value:
                    setattr(user, field, new_value)
                    changed_fields.append(field)
            
            elif is_profile_field:
                if field == 'date_of_birth' and new_value:
                    try:
                        # Chuyển đổi chuỗi ngày (d/m/Y) thành đối tượng date
                        new_value = datetime.strptime(new_value, '%d/%m/%Y').date()
                    except ValueError:
                        return JsonResponse({'error': 'Invalid date format. Use DD/MM/YYYY.'}, status=400)
                
                if getattr(profile, field) != new_value:
                    setattr(profile, field, new_value)
                    changed_fields.append(field)
            
            # (Không cần xử lý password ở đây vì lý do bảo mật)
            # Nếu có trường không hợp lệ, bạn có thể bỏ qua hoặc trả lỗi 400

        if changed_fields:
            user.save()
            profile.save()
            return JsonResponse({'success': True, 'message': 'Profile updated successfully.'})
        else:
            return JsonResponse({'success': True, 'message': 'No changes detected.'})


    # --- 2. Xử lý yêu cầu HIỂN THỊ (GET) ---
    else:
        # Lấy thông tin từ User và Profile để chuẩn bị JSON
        
        # Định dạng ngày sinh cho JavaScript (DD/MM/YYYY)
        dob_str = profile.date_of_birth.strftime('%d/%m/%Y') if profile.date_of_birth else None

        user_data = {
            'name': f"{user.first_name} {user.last_name}" if user.first_name or user.last_name else user.username,
            'email': user.email,
            'username': user.username,
            
            # Thông tin bổ sung
            'phonenumber': profile.phone_number,
            'address': profile.address,
            'dateofbirth': dob_str, 
        }
        
        user_data_json = json.dumps(user_data)
        
        context = {
            'user_data_json': user_data_json,
        }
        return render(request, 'app/account.html', context)