import os, json
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from django.conf import settings
import traceback
from langchain_ollama import OllamaEmbeddings

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 

data_path = os.path.join(settings.BASE_DIR, "ChatBoxAI", "fixtures")
cached_rag_chain = None

def format_location(item):
    f = item.get("fields", {})
    tags = f.get("tags", {})

    return (
        f"Địa điểm: {f.get('name')}\n"
        f"Loại hình: {tags.get('amenity', 'không rõ')}\n"
        f"Phong cách: {tags.get('activity_level', '')}, nhóm: {tags.get('group_type', '')}\n"
        f"Ngân sách: {tags.get('budget', '')}\n"
        f"Tọa độ: {f.get('latitude')}, {f.get('longtitude')}\n"
        f"Website: {f.get('website', '')}\n"
        f"Xếp hạng: {f.get('rating', 'chưa có')}/10\n"
        f"Mô tả: {f.get('description', 'Không có mô tả')}\n"
    )
    
def format_trip(trip):
    title = trip.get("title", "Chưa có tên tuyến")
    desc = trip.get("description", "Không có mô tả")
    rating = trip.get("avg_rating", "Chưa có")
    count = trip.get("rating_count", 0)

    stops = trip.get("stops", [])
    formatted_stops = "\n".join(
        [
            f"{idx+1}. {stop.get('name')} — dừng {stop.get('stay',0)} phút\n"
            f"   Địa chỉ: {stop.get('address','Không rõ')}\n"
            f"   Tọa độ: {stop.get('lat')}, {stop.get('lon')}"
            for idx, stop in enumerate(stops)
        ]
    )

    result = (
        f"Tuyến tham quan: {title}\n"
        f"Mô tả: {desc}\n"
        f"Đánh giá: {rating} sao dựa trên {count} lượt đánh giá.\n\n"
        f"Lộ trình các điểm dừng:\n{formatted_stops}\n"
    )
    return result

def get_rag_chain():
    global cached_rag_chain
    if cached_rag_chain is not None:
        return cached_rag_chain
    
    print("--- Đang khởi tạo AI và nạp dữ liệu... ---")
    
    if not os.path.exists(data_path):
        print(f"Không tìm thấy thư mục {data_path}")
        return None
    
    documents = []
    
    for filename in os.listdir(data_path):
        if filename.endswith(".json"):
            file_path = os.path.join(data_path, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    items_to_process = []
                    if isinstance(data, list):
                        items_to_process = data
                    elif isinstance(data, dict):
                        items_to_process = [data]
                        
                    for item in items_to_process:
                        text_content = None
                        
                        if item.get("model") == "MapScreen.Location":
                            text_content = format_location(item)
                            
                        elif "title" in item and "stops" in item:
                            text_content = format_trip(item)
                            
                        else:
                            if isinstance(item, dict): 
                                text_content = json.dumps(item, ensure_ascii=False, indent=2)
                            
                        if text_content and text_content.strip():
                            documents.append(
                                Document(page_content=text_content, metadata={"source": filename})
                            )
            except Exception as e:
                print(f"Lỗi đọc file {filename}: {e}")
    
    if not documents:
        print(f"Kiểm tra đường dẫn: {data_path}")
        if os.path.exists(data_path):
            print(f"Số lượng files trong fixtures: {len(os.listdir(data_path))} files")
        return None
    
    print(f"Đã nạp thành công {len(documents)} documents.")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    try:
        embedding = OllamaEmbeddings(
            model="nomic-embed-text",
            client_kwargs={"timeout": 700}
        )
        persist_dir = os.path.join(settings.BASE_DIR, "ChatBoxAI", "chroma_db")

        if os.path.exists(persist_dir):
            vectorstore = Chroma(
                persist_directory=persist_dir,
                embedding_function=embedding
            )
        else:
            vectorstore = Chroma.from_documents(
                documents=splits,
                embedding=embedding,
                persist_directory=persist_dir,
            )
            
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.2,
        )
        
        system_prompt = (
            "Bạn là trợ lý AI chuyên gợi ý du lịch tại TP.HCM. "
            "Ngữ cảnh bên dưới gồm 2 loại thông tin:\n"
            "- Danh sách ĐỊA ĐIỂM (chợ, nhà thờ, bảo tàng, điểm tham quan...) với mô tả chi tiết.\n"
            "- Một số TUYẾN THAM QUAN MẪU (default trips), chỉ mang tính tham khảo.\n\n"
            "Khi người dùng hỏi về 'chuyến đi', 'lịch trình', 'gợi ý tham quan', bạn hãy:\n"
            "1) Ưu tiên chọn các ĐỊA ĐIỂM phù hợp từ ngữ cảnh và tự thiết kế lịch trình mới (sắp xếp thứ tự, thời lượng gợi ý...)\n"
            "2) Có thể tham khảo các tuyến mẫu nếu chúng phù hợp, nhưng KHÔNG chỉ lặp lại y nguyên một tuyến mặc định trừ khi người dùng hỏi cụ thể.\n"
            "3) Nếu phù hợp, hãy đưa ra từ 2-3 phương án khác nhau (ví dụ: lịch trình nửa ngày, 1 ngày, buổi tối...).\n"
            "4) Chỉ sử dụng thông tin nằm trong ngữ cảnh. Nếu dữ liệu thiếu, hãy nói rõ giới hạn.\n\n"
            "Ngữ cảnh:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages(
            [("system", system_prompt),
            MessagesPlaceholder("chat_history"), 
            ("human", "{input}")]
        )
        
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        retriever = vectorstore.as_retriever(
            search_kwargs={"k": 3}
        )
        
        cached_rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        
        print("--- Khởi tạo xong ---")
        return cached_rag_chain
    except Exception as e:
        print(f"LỖI KHỞI TẠO LLM/VECTORSTORE: {e}")
        traceback.print_exc()
        return None
    
    
