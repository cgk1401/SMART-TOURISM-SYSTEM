from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required
def account_view(request):
    if request.method == 'POST' and 'avatar' in request.FILES:
        if not hasattr(request.user, 'profile'):
            from .models import Profile
            Profile.objects.create(user=request.user)
        request.user.profile.avatar = request.FILES['avatar']
        request.user.profile.save()
        messages.success(request, 'Avatar updated successfully!')
        return redirect('account')
    return render(request, 'app/account.html')

@login_required
def history_view(request):
    return render(request, 'app/history.html')