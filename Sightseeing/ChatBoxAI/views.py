from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .utils import get_rag_chain 
from langchain_core.messages import HumanMessage, AIMessage
import traceback 

def chat_page(request):
    return render(request, 'app/chat_widget.html')

@csrf_exempt
def chat_api(request):
    if request.method == 'POST':
       try:
            # Lấy dữ liệu từ client
            data = json.loads(request.body)

            user_message = data.get('message', '')

            # Gọi hàm để lấy chain(Chỉ khởi tạo lần đầu)
            chain = get_rag_chain()
            if chain is None:
                return JsonResponse({'response': 'Hệ thống chưa nạp được dữ liệu (Kiểm tra thư mục fixtures).'})
            
            # Lấy History từ session
            raw_history = request.session.get("chat_history", [])
            history = []
            for m in raw_history:
                if m["role"] == "human":
                    history.append(HumanMessage(content=m["content"]))
                elif m["role"] == "ai":
                    history.append(AIMessage(content=m["content"]))
                    
            # Hỏi AI
            result = chain.invoke(
                {
                    "input": user_message,
                    "chat_history" :history
                })
            answer = result['answer']
            
            # Cập nhật history trong session
            raw_history.append(
                {"role": "human", "content": user_message}
            )
            
            raw_history.append(
                {"role": "ai", "content": answer}
            )
            
            request.session["chat_history"] = raw_history
            
            return JsonResponse({'response': answer})
       except Exception as e:
           
           traceback.print_exc()
           return JsonResponse({
               'error': str(e)
           }, status = 500)
    return JsonResponse({'error': 'Invalid request'}, status=400)