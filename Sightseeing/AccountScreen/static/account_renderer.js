// Dữ liệu giả định:
const ACCOUNT_FIELDS_DATA = [
    { label: "Name", value: "Minh Triet", id: "user-name" },
    { label: "Password", value: "•••••••••••••••••", id: "user-password" },
    { label: "Date of birth", value: "02-24-1996", id: "user-dob" }
];

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
    
    // Bắt đầu render các hàng thông tin
    renderAccountRows(ACCOUNT_FIELDS_DATA, template, container);
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


// *Lưu ý: Cần một hàm fetchAccountData() 
// để lấy dữ liệu từ Python Backend và gọi renderAccountRows với dữ liệu thực.*