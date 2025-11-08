document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('AI-Toggle');
    const panel = document.getElementById('AI-Panel');
    const closeBtn = document.getElementById('AI-Close');
    const chat = document.getElementById('AI-Chat');
    const input = document.getElementById('Button-Input');
    const sendBtn = document.getElementById('Button-Send');

    // Toggle panel
    toggleBtn.addEventListener('click', function() {
        panel.hidden = false;
        setTimeout(() => panel.classList.add('show'), 10);
    });

    // Close panel
    closeBtn.addEventListener('click', function() {
        panel.classList.remove('show');
        setTimeout(() => panel.hidden = true, 300);
    });

    // Send message (demo)
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const message = input.value.trim();
        if (!message) return;

        // User message
        const userMsg = document.createElement('div');
        userMsg.className = 'u';
        userMsg.textContent = message;
        chat.appendChild(userMsg);

        // Clear input
        input.value = '';

        // Call backend API
        axios.post('/chat/api/chat/', { message }, { headers: { 'Content-Type': 'application/json' } })
            .then(res => {
                // Xử lý khi nhận phản hồi thành công
                let text = (res.data && res.data.reply);
                if (text === undefined || text === null || text === '') {
                    text = 'Không nhận được phản hồi.';
                }
                if (typeof text !== 'string') {
                    try { text = JSON.stringify(text, null, 2); } catch (e) { text = String(text); }
                }
                const aiMsg = document.createElement('div');
                aiMsg.className = 'b';
                aiMsg.textContent = text;
                chat.appendChild(aiMsg);
                scrollToBottom();
            })
            .catch(err => {
                // Xử lý khi lỗi
                let detail = 'Lỗi kết nối AI.';
                if (err.response && err.response.data) {
                    let d = err.response.data;
                    if (d.detail) d = d.detail;
                    else if (d.error) d = d.error;
                    try { detail = typeof d === 'string' ? d : JSON.stringify(d, null, 2); } catch (e) { detail = String(d); }
                }
                const aiMsg = document.createElement('div');
                aiMsg.className = 'b';
                aiMsg.textContent = detail;
                chat.appendChild(aiMsg);
                scrollToBottom();
            });

        scrollToBottom();
    }

    function scrollToBottom() {
        chat.scrollTop = chat.scrollHeight;
    }

    // Focus input khi mở panel
    toggleBtn.addEventListener('click', () => {
        setTimeout(() => input.focus(), 400);
    });
});