from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Profile  # ← ADD THIS LINE

@login_required
def account_view(request):
    # Create profile if not exists
    Profile.objects.get_or_create(user=request.user)

    if request.method == 'POST' and 'avatar' in request.FILES:
        request.user.profile.avatar = request.FILES['avatar']
        request.user.profile.save()
        messages.success(request, 'Avatar updated!')
        return redirect('account')

    return render(request, 'app/account.html')

@login_required
def history_view(request):
    return render(request, 'app/history.html')