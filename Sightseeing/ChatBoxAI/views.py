import os
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google import genai
from google.genai.errors import APIError 


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    print("Gemini API Client initialized.")
else:
    gemini_client = None
    print("NOT FOUND API_KEY")
    

@csrf_exempt
def ai_chat(request):
    if request.method != "POST":
        return JsonResponse({
            "reply": "Chỉ hỗ trợ POST request"
        }, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        user_message = data.get("message", "").strip()

        if not user_message:
            return JsonResponse({
                "reply": "Nhập tin nhắn"
            }, status=400)
        
        if gemini_client is None:
            return JsonResponse({
                "reply": "Lỗi: API Key chưa được cấu hình."
            }, status=500)

        response = gemini_client.models.generate_content(
            model = GEMINI_MODEL,
            contents=user_message 
        )
        
        # Trả về phản hồi từ AI
        reply = response.text
        
        return JsonResponse({"reply": reply})

    except APIError as e:
        return JsonResponse({
            "reply": f"Lỗi API: {str(e)}"
        }, status=500)
        
    except Exception as e:
        return JsonResponse({
            "reply": f"Lỗi chung: {str(e)}"
        }, status=500)



