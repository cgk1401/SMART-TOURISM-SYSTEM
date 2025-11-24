from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def setting_view(request):
    return render(request, 'app/setting.html')

@csrf_exempt
def update_settings(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        request.session['navbar_opacity'] = data.get('opacity', 0.9)
        request.session['language'] = data.get('language', 'en')
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)