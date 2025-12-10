document.addEventListener('DOMContentLoaded', () => {
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatBox = document.getElementById('chat-box');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    const API_URL = '/chat/api/chat/'; 
    let isSending = false; 

    chatToggleBtn.addEventListener('click', () => {
        chatBox.classList.toggle('hidden');
        if (!chatBox.classList.contains('hidden')) {
            // Khi mở, focus vào input
            userInput.focus();
            scrollToBottom();
        }
    });

    function addMessageToDOM(message, role, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${role}-message`);
        
        if (isTyping) {
            messageDiv.id = 'typing-indicator';
            messageDiv.classList.add('typing-indicator');
        }

        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');
        let formattedMessage = message;
        if (!isTyping) {
            formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedMessage = formattedMessage.replace(/\n/g, '<br>');
        }
        
        bubble.innerHTML = formattedMessage; 
        messageDiv.appendChild(bubble);

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Logic gửi tin nhắn
    async function sendMessage() {
        const userMessage = userInput.value.trim();

        if (userMessage === '' || isSending) {
            return;
        }

        isSending = true;
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        addMessageToDOM(userMessage, 'human');
        
        addMessageToDOM('AI đang trả lời...', 'ai', true);

        try {
            const response = await axios.post(API_URL, {
                message: userMessage
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }

            const aiResponse = response.data.response || 'Đã xảy ra lỗi khi nhận phản hồi.';

            addMessageToDOM(aiResponse, 'ai');

        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            addMessageToDOM('Lỗi kết nối: Không thể nhận phản hồi từ AI. Vui lòng thử lại.', 'ai');
        } finally {
            isSending = false;
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
})