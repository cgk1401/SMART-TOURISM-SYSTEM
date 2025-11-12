// Convert backend data to display format
function getAccountFieldsData() {
    const userData = window.USER_DATA || {};
    return [
        { label: "Name", value: userData.name || "Not set", id: "user-name" },
        { label: "Email", value: userData.email || "Not set", id: "user-email" },
        { label: "Username", value: userData.username || "Not set", id: "user-username" }
    ];
}

// Chờ cho toàn bộ DOM được tải xong trước khi chạy script
document.addEventListener('DOMContentLoaded', initializeAccountView);

/**
 * @function initializeAccountView
 * Hàm khởi tạo chính: Lấy template, khung chứa và bắt đầu render.
 */
function initializeAccountView() {
    const template = document.getElementById('account-row-template');
    const container = document.getElementById('account-info-list');

    // Guardrail: Đảm bảo các phần tử cần thiết tồn tại
    if (!template || !container) {
        console.error('Lỗi: Không tìm thấy template hoặc khung chứa #account-info-list trong DOM.');
        return;
    }
    
    // Get data and render rows
    const accountData = getAccountFieldsData();
    renderAccountRows(accountData, template, container);
}


/**
 * @function renderAccountRows
 * Hàm chính để lặp qua dữ liệu và chèn các hàng thông tin vào DOM.
 * @param {Array<Object>} data - Danh sách các trường dữ liệu (label, value, id).
 * @param {HTMLTemplateElement} template - Thẻ template HTML.
 * @param {HTMLElement} container - Khung chứa #account-info-list.
 */
function renderAccountRows(data, template, container) {
    const fragment = document.createDocumentFragment();

    data.forEach(field => {
        // Sao chép template
        const clone = document.importNode(template.content, true);
        const row = clone.querySelector('.account-row');
        
        const labelElement = clone.querySelector('.info-label-text');
        const valueElement = clone.querySelector('.info-value-text');
        const editButton = clone.querySelector('.edit-button-style');

        // 1. Gán ID cho hàng (dataset) và Value để dễ dàng truy cập và cập nhật sau này
        row.dataset.fieldId = field.id; 
        valueElement.id = field.id; // Gán ID trực tiếp cho thẻ chứa giá trị

        // 2. Điền Label và Value
        labelElement.textContent = field.label;
        valueElement.textContent = field.value;

        // 3. Thêm sự kiện Edit
        editButton.addEventListener('click', () => {
            alert(`Mở form chỉnh sửa cho trường: ${field.label}`);
            // THỰC TẾ: Bạn sẽ gọi một hàm mở modal/form chỉnh sửa tại đây
            // Ví dụ: showEditModal(field.id, field.value);
        });

        fragment.appendChild(row);
    });

    // Chèn tất cả các phần tử đã tạo vào DOM một lần
    container.appendChild(fragment);
}



function submitAvatar() {
            const form = document.getElementById('avatar-form');
            const file = document.getElementById('avatar-input').files[0];
            if (file) {
                const formData = new FormData(form);
                fetch('/account/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': '{{ csrf_token }}',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                    .then(response => {
                        if (response.ok) {
                            location.reload();
                        } else {
                            alert('Upload failed. Please try again.');
                        }
                    })
                    .catch(() => {
                        alert('Network error. Please check your connection.');
                    });
            }
        }