
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
 * @function validateEmail
 * Kiểm tra xem chuỗi có khớp với định dạng email cơ bản không: user@domain.tld
 *
 * @param {string} emailString - Chuỗi email cần kiểm tra.
 * @returns {boolean} True nếu email hợp lệ, False nếu ngược lại.
 */
function validateEmail(emailString) {
    // Regex cơ bản và phổ biến nhất để kiểm tra email.
    // ^[^\s@]+ : Bắt đầu bằng một hoặc nhiều ký tự không phải khoảng trắng hoặc @
    // @ : Theo sau là ký tự @
    // [^\s@]+\. : Theo sau là tên miền (một hoặc nhiều ký tự không phải khoảng trắng hoặc @, kết thúc bằng dấu chấm)
    // [^\s@]+$ : Kết thúc bằng phần mở rộng tên miền (một hoặc nhiều ký tự không phải khoảng trắng hoặc @)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Kiểm tra chuỗi đầu vào (sau khi đã được trim ở hàm handleEditClick)
    return emailRegex.test(emailString);
}


function validateDate(dateString) {
    // Regex kiểm tra định dạng DD/MM/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/; 
    const match = dateString.match(dateRegex);

    if (!match) {
        return false; // Sai format
    }

    // Lấy giá trị ngày, tháng, năm từ Regex
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Kiểm tra tính hợp lệ của ngày tháng năm
    const date = new Date(year, month - 1, day); // month - 1 vì JS dùng 0-11
    
    // Kiểm tra: 
    // 1. Có phải là ngày hợp lệ không (date.getTime() là NaN nếu không hợp lệ)
    // 2. Ngày, tháng, năm sau khi tạo Date có khớp với giá trị ban đầu không (để loại bỏ ngày 30/02)
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
}


function validatePhoneNumber(value) {
    const phoneRegex = /^\+?\d{9,15}$/; 
    return phoneRegex.test(value);
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
        
        let type;
        switch (field.id) {
            case "user-email":
                type = 'email'; // Kiểu input email
                break;
            case "user-phone_number":
                type = 'tel'; // Kiểu input điện thoại 
                break;
            case "user-date_of_birth":
                type = 'date_text'; // Vẫn giữ date_text 
                break;
            default:
                type = 'text'; // Mặc định là text
                break;
        }
        editButton.dataset.inputType = type; // Gán kiểu input đã xác định

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
    
    // Đặt kiểu input dựa trên inputType đã gán
    if (inputType === 'date_text') {
        inputField.type = 'text'; // Giữ lại text input để kiểm soát format DD/MM/YYYY
    } else {
        inputField.type = inputType; // Sử dụng 'email', 'tel', hoặc 'text'
    }
    
    inputField.value = currentValue;
    inputField.className = 'edit-input-field'; 
    
    // --- GÁN PLACEHOLDER RIÊNG BIỆT ---
    let specificPlaceholder = '';
    
    switch (fieldId) {
        case 'user-email':
            specificPlaceholder = 'name@example.com';
            break;
        case 'user-phone_number':
            specificPlaceholder = '(xxx) xxx-xxxx'; 
            break;
        case 'user-date_of_birth':
            specificPlaceholder = 'DD/MM/YYYY';
            break;
        case 'user-address':
            specificPlaceholder = 'Street, City';
            break;
        default:
            specificPlaceholder = fieldLabel; // Mặc định sử dụng Label
            break;
    }

    inputField.placeholder = specificPlaceholder;
    // ------------------------------------
    
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

        if (fieldId === 'user-email' && newValue !== 'Not set') {
            if (newValue!== '' && !validateEmail(newValue)) {
                alert( 'Địa chỉ Email không hợp lệ. Vui lòng nhập đúng định dạng user@domain.com.');
                inputField.value = '';
                inputField.focus(); 
                return;
            }
        }

        // Xử lý định dạng ngày tháng nếu cần (DD/MM/YYYY)
        if (fieldId === 'user-date_of_birth' && newValue !== 'Not set') {
            if (newValue!== '' && !validateDate(newValue)){
                alert('Ngày sinh phải ở định dạng DD/MM/YYYY hợp lệ.');
                inputField.value = '';
                inputField.focus()
                return;
            }
        }


        
        // Gán lại 'Not set' nếu giá trị trống
        newValue = newValue || 'Not set'; 

        if (fieldId === 'user-phone_number' && newValue !== 'Not set') {
            if (!validatePhoneNumber(newValue)) {
                alert('Số điện thoại không hợp lệ. Vui lòng chỉ nhập số và dấu "+" (nếu cần).');
                inputField.value = '';
                inputField.focus()
                return; // Ngừng gửi dữ liệu nếu validation thất bại
            }
        }

        // Gửi dữ liệu đi
        saveUserData(fieldId, newValue)
            .then(() => {
                // Chỉ khôi phục trạng thái nếu lưu thành công
                // 1. Khôi phục DOM
                infoValueWrapper.replaceChild(infoValueElement, inputField);
                infoValueElement.textContent = newValue; 

                updateSummaryInfo(fieldId, newValue);
                
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

    data[fieldName] = newValue === 'Not set' ? '' : newValue;
    

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

    accountData.forEach(field => {
        // Chỉ cập nhật nếu trường có thể chỉnh sửa và không phải là 'Not set'
        if (field.editable && field.value !== 'Not set') {
            // Sử dụng hàm updateSummaryInfo để chèn/cập nhật thông tin vào khối About Me
            updateSummaryInfo(field.id, field.value);
        }
    });
}

// Chờ cho toàn bộ DOM được tải xong trước khi chạy script
document.addEventListener('DOMContentLoaded', initializeAccountView);

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


/**
 * @function updateSummaryInfo
 * Cập nhật thông tin chi tiết (icon + value) vào cột bên trái sau khi lưu thành công.
 */
function updateSummaryInfo(fieldId, newValue) {
    const container = document.getElementById('summary-info-container');
    const template = document.getElementById('summary-info-template');
    
    if (!container || !template) return;

    // 1. Xác định ID icon
    let iconId;
    let iconClass = 'summary-icon-' + fieldId.replace('user-', ''); // Ví dụ: summary-icon-email
    
    switch (fieldId) {
        case 'user-email':
            iconId = 'fa-envelope';
            break;
        case 'user-phone_number':
            iconId = 'fa-phone';
            break;
        case 'user-date_of_birth':
            iconId = 'fa-calendar';
            break;
        case 'user-address':
            iconId = 'fa-location-dot';
            break;
        default:
            return; 
    }

    // 2. Tìm kiếm hàng cũ (nếu có)
    let existingRow = container.querySelector('.' + iconClass);

    if (newValue === 'Not set' || newValue === '') {
        // Nếu giá trị là Not set hoặc trống, ẩn hoặc xóa hàng cũ
        if (existingRow) {
            existingRow.remove();
        }
        return;
    }

    // 3. Tạo hoặc Cập nhật hàng
    if (!existingRow) {
        // Nếu chưa có, tạo mới từ template
        const clone = document.importNode(template.content, true);
        const newRow = clone.querySelector('.summary-info-row');
        newRow.classList.add(iconClass); // Thêm class để dễ dàng tìm kiếm lần sau

        const iconElement = newRow.querySelector('.summary-icon');
        iconElement.classList.add('fa-solid', iconId);
        
        newRow.querySelector('.summary-value-text').textContent = newValue;
        container.appendChild(newRow);
    } else {
        // Nếu đã có, chỉ cập nhật giá trị
        existingRow.querySelector('.summary-value-text').textContent = newValue;
    }
}


