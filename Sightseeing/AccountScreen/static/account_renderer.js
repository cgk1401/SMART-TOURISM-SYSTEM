
// --- PHẦN 1: LẤY DỮ LIỆU & RENDER ---

/**
 * @function getAccountFieldsData
 * Chuyển đổi dữ liệu backend sang định dạng hiển thị cho frontend.
 */
function getAccountFieldsData() {
    const userData = window.USER_DATA || {};
    // ID được gán cho field: 'user-' + tên trường trong Django view/model (ví dụ: 'phone_number')
    return [
        { label: "Name", value: userData.name || "Not set", id: "user-name", editable: false }, 
        { label: "Email", value: userData.email || "Not set", id: "user-email", editable: true },
        { label: "Date of Birth", value: userData.dateofbirth || "Not set", id: "user-date_of_birth", editable: true },
        { label: "Phone Number", value: userData.phonenumber || "Not set", id: "user-phone_number", editable: true },
        { label: "Address", value: userData.address || "Not set", id: "user-address", editable: true }
    ];
}

/**
 * @function renderAccountRows
 * Hàm chính để lặp qua dữ liệu và chèn các hàng thông tin vào DOM.
 */
function renderAccountRows(data, template, container) {
    const fragment = document.createDocumentFragment();

    data.forEach(field => {
        const clone = document.importNode(template.content, true);
        const row = clone.querySelector('.account-row');
        
        const labelElement = clone.querySelector('.info-label-text');
        const valueElement = clone.querySelector('.info-value-text');
        const editButton = clone.querySelector('.edit-button-style');

        // Gán ID cho ROW (ví dụ: user-email)
        row.id = field.id; 
        
        // Gán Label cho nút EDIT để JS biết đang chỉnh sửa trường nào
        editButton.dataset.label = field.label; 
        
        // Thêm data attribute cho kiểu input (cho phép tùy chỉnh sau này)
        if (field.id === "user-date_of_birth") {
            editButton.dataset.inputType = 'date_text'; // Sử dụng text input để nhập DD/MM/YYYY
        } else {
            editButton.dataset.inputType = 'text';
        }
        
        // 2. Điền Label và Value
        labelElement.textContent = field.label;
        valueElement.textContent = field.value;

        // 3. Gắn sự kiện CHỈ MỘT LẦN cho các trường có thể chỉnh sửa
        if (field.editable) {
            editButton.addEventListener('click', handleEditClick);
        } else {
            // Ẩn nút Edit nếu trường không thể chỉnh sửa (ví dụ: Full Name)
            editButton.style.visibility = 'hidden'; 
        }

        fragment.appendChild(row);
    });

    container.appendChild(fragment);
}


// --- PHẦN 2: XỬ LÝ SỰ KIỆN VÀ DOM ---

/**
 * @function handleEditClick
 * Chuyển đổi từ text sang input field và nút Edit sang Save.
 */
function handleEditClick(event) {
    const button = event.currentTarget;
    const accountRow = button.closest('.account-row');
    const infoValueWrapper = accountRow.querySelector('.info-details-wrapper');
    const infoValueElement = accountRow.querySelector('.info-value-text');
    const fieldId = accountRow.id; // user-email, user-phone_number, etc.
    const fieldLabel = button.dataset.label;
    const inputType = button.dataset.inputType;

    // Giá trị hiện tại (đã làm sạch 'Not set')
    const currentValue = infoValueElement.textContent === 'Not set' ? '' : infoValueElement.textContent;

    // 1. Thay thế văn bản bằng input field
    const inputField = document.createElement('input');
    inputField.type = 'text'; // Luôn dùng text input để kiểm soát format ngày tháng
    inputField.value = currentValue;
    inputField.className = 'edit-input-field'; 
    inputField.placeholder = fieldLabel;
    
    // Thay thế div bằng input
    infoValueWrapper.replaceChild(inputField, infoValueElement);

    // 2. Chuyển đổi nút Edit thành nút Save
    button.innerHTML = '<span class="edit-text-style">Save</span>';
    button.classList.add('save-button');
    
    // 3. Focus vào input và gắn sự kiện Enter
    inputField.focus();

    inputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Ngăn form submit mặc định
            button.click(); // Giả lập hành động click nút Save
        }
    });

    // 4. Gắn sự kiện cho nút Save
    button.removeEventListener('click', handleEditClick); // Xóa event Edit cũ
    button.addEventListener('click', function handleSaveClick() {
        // Lấy giá trị mới
        let newValue = inputField.value.trim();
        
        // Xử lý định dạng ngày tháng nếu cần (DD/MM/YYYY)
        if (fieldId === 'user-date_of_birth' && newValue !== '') {
            // Thêm logic kiểm tra format ngày tháng nếu cần
        }
        
        // Gán lại 'Not set' nếu giá trị trống
        newValue = newValue || 'Not set'; 

        // Gửi dữ liệu đi
        saveUserData(fieldId, newValue)
            .then(() => {
                // Chỉ khôi phục trạng thái nếu lưu thành công
                // 1. Khôi phục DOM
                infoValueWrapper.replaceChild(infoValueElement, inputField);
                infoValueElement.textContent = newValue; 
                
                // 2. Khôi phục nút
                button.innerHTML = `<svg class="edit-icon-reusable" width="20" height="20">
                                        <use href="#icon-edit-pencil" xlink:href="#icon-edit-pencil"></use>
                                    </svg>
                                    <span class="edit-text-style">Edit</span>`;
                button.classList.remove('save-button');
                
                // 3. Khôi phục sự kiện
                button.removeEventListener('click', handleSaveClick);
                button.addEventListener('click', handleEditClick);
            })
            .catch(() => {
                // Nếu lỗi, DOM đã được khôi phục hoặc reload trang trong saveUserData
            });
    });
}


// --- PHẦN 3: XỬ LÝ AJAX ---

/**
 * @function saveUserData
 * Gửi dữ liệu cập nhật đến Django backend bằng AJAX (JSON).
 * @returns {Promise} Trả về Promise để biết kết quả lưu.
 */
function saveUserData(fieldId, newValue) {
    // Lấy CSRF token (thẻ input trong HTML)
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value || getCookie('csrftoken'); 

    // Chuẩn bị dữ liệu: { 'phone_number': '0901234567' }
    const data = {};
    const fieldName = fieldId.replace('user-', ''); 
    
    // Nếu là ngày sinh, đảm bảo gửi định dạng DD/MM/YYYY
    if (fieldId === 'user-date_of_birth') {
        data[fieldName] = newValue === 'Not set' ? '' : newValue; 
    } else {
        data[fieldName] = newValue === 'Not set' ? '' : newValue; 
    }

    return fetch("/account/", { // Dùng URL cứng nếu {% url %} không hoạt động trong file JS tĩnh
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken 
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            // Nếu Django trả về lỗi 4xx/5xx
            throw new Error(`Cập nhật thất bại (${response.status} ${response.statusText})`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            alert(`Lỗi từ Server: ${data.error}`);
            location.reload(); 
        } else {
            alert('Cập nhật thành công!');
        }
    })
    .catch(error => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        alert(`Lưu thất bại: ${error.message}. Trang sẽ được tải lại.`);
        location.reload(); // Tải lại trang khi lỗi nghiêm trọng
        throw error;
    });
}


// --- PHẦN 4: KHỞI TẠO ---

// Hàm lấy CSRF Token từ cookie (phòng trường hợp không có trong DOM)
function getCookie(name) {
    // ... (Giữ nguyên hàm này)
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

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

// Chờ cho toàn bộ DOM được tải xong trước khi chạy script
document.addEventListener('DOMContentLoaded', initializeAccountView);

// Giữ nguyên hàm submitAvatar nếu bạn dùng nó
function submitAvatar() {
    // ... (Giữ nguyên hàm submitAvatar của bạn)
    const form = document.getElementById('avatar-form');
    const file = document.getElementById('avatar-input').files[0];
    if (file) {
        const formData = new FormData(form);
        fetch('/account/', {
            method: 'POST',
            body: formData,
            // X-CSRFToken được lấy từ thẻ input ẩn trong form
            headers: {
                // 'X-CSRFToken': '{{ csrf_token }}', // Lấy từ DOM trong trường hợp này
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