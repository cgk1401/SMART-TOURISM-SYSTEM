from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

def function_login(request):
    return render(request, 'app/login.html')

def function_register(request):
    return render(request, 'app/register.html')

@csrf_exempt
def check_login(request):
    if request.method != "POST":
        return JsonResponse({
            "message": "Chỉ hỗ trợ POST",
        }, status = 405)
        
    try:
        data = json.loads(request.body.decode("utf-8"))
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        
        user = authenticate(request, username = username, password = password)
        
        if user is not None:
            login(request, user)
            return JsonResponse({
                "success": True,
                "message": "Login Successful"
            })

        else:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Incorrect username or password"
                }
            )
            
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": f"lỗi : {str(e)}"
        }, status = 500)
    
    
@csrf_exempt
def check_register(request):
    if request.method != "POST":
        return JsonResponse({
            "message": "Chỉ hỗ trợ POST",
        }, status = 405)
        
    
    try :
        data = json.loads(request.body.decode("utf-8"))
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        
        if User.objects.filter(username = username).exists():
            return JsonResponse({
                "success": False,
                "message": "Username already existed"
            })
        else :
            User.objects.create_user(username = username, password = password)
            return JsonResponse({
                "success": True,
                "message": "Register Successful"
            })
            
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": f"Lỗi: {str(e)}"
        }, status = 500)
    
    