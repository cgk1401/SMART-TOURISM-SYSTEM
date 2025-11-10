
// Function to format date from backend format (YYYY-MM-DD) to display format (MMM DD, YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get trip history data from backend
function getTripHistoryData() {
    const tripHistory = window.TRIP_HISTORY || [];
    return tripHistory.map(trip => ({
        ...trip,
        date: formatDate(trip.date)  // Format the date for display
    }));
}

// Chờ cho toàn bộ DOM được tải xong trước khi chạy script
document.addEventListener('DOMContentLoaded', initializeHistoryRenderer);


/**
 * @function initializeHistoryRenderer
 * Hàm khởi tạo chính: Lấy template, dữ liệu và bắt đầu render.
 */
function initializeHistoryRenderer() {
    const template = document.getElementById('trip-history-item-template');
    const historyListContainer = document.getElementById('history-list');

    // Guardrail: Đảm bảo các phần tử cần thiết tồn tại
    if (!template || !historyListContainer) {
        console.error('Lỗi: Không tìm thấy template hoặc khung chứa #history-list trong DOM.');
        return;
    }
    
    // Get data from backend and render
    const tripData = getTripHistoryData();
    renderTripHistory(tripData, template, historyListContainer);
}


/**
 * @function createPlaceTag
 * Tạo thẻ HTML cho một địa điểm cụ thể (VD: Quan 3 HCMC).
 * @param {object} place - Đối tượng địa điểm {name, location}.
 * @returns {HTMLElement} Phần tử div.place-tag-item hoàn chỉnh.
 */
function createPlaceTag(place) {
    const placeItem = document.createElement('div');
    placeItem.className = 'place-tag-item';
    
    // Sử dụng icon SVG đã định nghĩa: #icon-location-heart
    placeItem.innerHTML = `
        <svg class="place-icon" width="20" height="20">
            <use href="#icon-location-heart"></use>
        </svg>
        <div class="place-name-location">
            <div class="place-name">${place.name}</div>
            <div class="place-location">${place.location}</div>
        </div>
    `;
    return placeItem;
}


/**
 * @function renderTripHistory
 * Hàm chính để lặp qua dữ liệu và chèn các mục lịch sử vào DOM.
 * @param {Array<Object>} data - Danh sách các chuyến đi (từ dữ liệu giả định hoặc Fetch API).
 * @param {HTMLTemplateElement} template - Thẻ template HTML.
 * @param {HTMLElement} container - Khung chứa #history-list.
 */
function renderTripHistory(data, template, container) {
    // Sử dụng DocumentFragment để tối ưu hóa hiệu suất (giảm thiểu thao tác DOM)
    const fragment = document.createDocumentFragment();

    data.forEach(trip => {
        // Sao chép template (deep clone)
        const clone = document.importNode(template.content, true);
        const tripCard = clone.querySelector('.trip-card');
        const placesWrapper = clone.querySelector('.trip-places-wrapper');

        // --- 1. Điền thông tin CHUNG (Footer) ---
        // SỬA LỖI: Sử dụng data-type cố định để nhận dạng phần tử thay vì giá trị placeholder
        
        // Cập nhật Ngày
        clone.querySelector('.trip-footer .info-value[data-type="date"]').textContent = trip.date;

        // Cập nhật Tổng số Địa điểm
        clone.querySelector('.trip-footer .info-value[data-type="total-places"]').textContent = trip.totalPlaces;
        
        // Cập nhật Thời lượng
        clone.querySelector('.trip-footer .info-value[data-type="duration"]').textContent = trip.duration;

        // --- 2. Tạo và điền thông tin ĐỊA ĐIỂM (Header) ---
        placesWrapper.innerHTML = ''; // Xóa mọi nội dung placeholder tĩnh (nếu có)

        trip.places.forEach((place, index) => {
            // Thêm thẻ địa điểm (sử dụng hàm createPlaceTag bên ngoài)
            const placeItem = createPlaceTag(place);
            placesWrapper.appendChild(placeItem);

            // Thêm dấu phân cách (chỉ khi không phải là địa điểm cuối cùng)
            if (index < trip.places.length - 1) {
                const separator = document.createElement('div');
                separator.className = 'place-separator';
                
                // Sử dụng icon chevron-right
                separator.innerHTML = `
                    <svg class="separator-icon" width="24" height="24">
                        <use href="#icon-chevron-right"></use>
                    </svg>
                `;
                placesWrapper.appendChild(separator);
            }
        });
        
        // --- 3. Thêm Sự kiện cho Nút Chi tiết ---
        const detailsButton = clone.querySelector('.view-details-button');
        detailsButton.addEventListener('click', () => {
            alert(`Xem chi tiết chuyến đi ID: ${trip.id}`);
            // Thực tế: window.location.href = '/trip/' + trip.id;
        });

        // Đưa phần tử đã điền dữ liệu vào fragment
        fragment.appendChild(tripCard);
    });

    // Chèn tất cả vào DOM chỉ trong một thao tác
    container.appendChild(fragment);
}