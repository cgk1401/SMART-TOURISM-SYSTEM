from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

def function_login(request):
    return render(request, 'app/login.html')

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
                "message": "Đăng nhập thành công"
            })

        else:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Username hoặc password sai"
                }
            )
            
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": f"lỗi : {str(e)}"
        }, status = 500)
    
    
    
# def register_user(request):
#     if request.method == "POST":
#         username = request.POST["username"]
#         password = request.POST["password"]

#         if User.objects.filter(username=username).exists():
#             messages.error(request, "Username already exists.")
#         else:
#             User.objects.create_user(username=username, password=password)
#             messages.success(request, "Account created successfully")
#             return redirect('/')

#     return render(request, 'app/register.html')