document.addEventListener("DOMContentLoaded", () => {
    const btnCurrent = document.getElementById("btn-current-route"); // nút hiện tạitrên sidebar
    const btnHistory = document.getElementById("btn-history-trip"); // nút lịch sử trên sidebar
    const currentSection = document.getElementById("current-trip-section");
    const historySection = document.getElementById("history-trip-section");

    const currentListEl = document.getElementById("current-trip-list");
    const historyListEl = document.getElementById("history-trip-list");
    const currentEmptyEl = document.getElementById("current-empty");
    const historyEmptyEl = document.getElementById("history-empty");

    const currentDetailEl = document.getElementById("current-trip-detail");
    const historyDetailEl = document.getElementById("history-trip-detail");

    let currentTrips = [];
    let historyTrips = [];

    //
    function setActiveTab(tab) {
        if (tab === "current") {
            // chỉnh sửa giao diện các nút trên sidebar
            btnCurrent.classList.add("active");
            btnHistory.classList.remove("active");
            currentSection.classList.add("active");
            historySection.classList.remove("active");
        } else {
            btnHistory.classList.add("active");
            btnCurrent.classList.remove("active");
            historySection.classList.add("active");
            currentSection.classList.remove("active");
        }
    }
    // sự kiện click trên sidebar
    btnCurrent.addEventListener("click", () => setActiveTab("current"));
    btnHistory.addEventListener("click", () => setActiveTab("history"));

    // lấy data 
    async function loadCurrentTrips() {
        try {
            const res = await axios.get("/MainScreen/RouteScreen/getunSavedTrip/");
            // backend trả list ([]) – nếu bạn trả 1 object thì chuyển lại cho đúng
            currentTrips = res.data || [];
            renderTripList(currentListEl, currentTrips, currentEmptyEl, {
                allowRatingEdit: true,
                onSelect: trip => renderTripDetail(trip, currentDetailEl, true)
            });
        } catch (err) {
            console.error("getUnsavedTrips error:", err);
            currentTrips = [];
            renderTripList(currentListEl, currentTrips, currentEmptyEl, {
                allowRatingEdit: true,
                onSelect: trip => renderTripDetail(trip, currentDetailEl, true)
            });
        }
    }

    async function loadHistoryTrips() {
        try {
            const res = await axios.get("/MainScreen/RouteScreen/getallTrips/");
            historyTrips = res.data || [];
            renderTripList(historyListEl, historyTrips, historyEmptyEl, {
                allowRatingEdit: false,
                onSelect: trip => renderTripDetail(trip, historyDetailEl, false)
            });
        } catch (err) {
            console.error("/MainScreen/RouteScreen/getAllTrips error:", err);
            historyTrips = [];
            renderTripList(historyListEl, historyTrips, historyEmptyEl, {
                allowRatingEdit: false,
                onSelect: trip => renderTripDetail(trip, historyDetailEl, false)
            });
        }
    }

    // ---------------- RENDER LIST ----------------
    function renderTripList(container, trips, emptyEl, options) {
        const { allowRatingEdit, onSelect } = options;
        container.innerHTML = "";

        if (!trips || trips.length === 0) {
            emptyEl.classList.remove("hidden");
            return;
        }
        emptyEl.classList.add("hidden");

        trips.forEach(trip => {
            const card = document.createElement("div");
            card.className = "trip-card";
            card.dataset.tripId = trip.id;

            const createdAt = trip.created_at || "";

            card.innerHTML = `
                <div class="trip-card-main">
                    <div class="trip-card-title">${trip.title || "Chuyến đi không tên"}</div>
                    <div class="trip-card-meta">
                        <span><i class="fa-regular fa-calendar"></i>${createdAt}</span>
                        <span><i class="fa-regular fa-clock"></i>${trip.stops.length} điểm dừng</span>
                    </div>
                </div>
                <div class="trip-card-rating">
                    ${
                        trip.avg_rating >= 0
                            ? `<div class="rating-badge"><i class="fa-solid fa-star"></i>${trip.avg_rating.toFixed(1)} (${trip.rating_count})</div>`
                            : `<div class="rating-badge">Nháp</div>`
                    }
                    ${
                        allowRatingEdit
                            ? `<div class="rating-input-row">
                                   <span>Đánh giá:</span>
                                   <input type="number" min="1" max="5" step="1" value="${
                                       trip.avg_rating > 0 ? trip.avg_rating : 5
                                   }" class="rating-input" />
                                   <button class="btn-save-rating">Lưu</button>
                               </div>`
                            : ""
                    }
                </div>
            `;

            // chọn trip
            card.addEventListener("click", e => {
                // không trigger khi bấm nút Lưu
                if (e.target.closest(".btn-save-rating")) return;

                container
                    .querySelectorAll(".trip-card")
                    .forEach(el => el.classList.remove("active"));
                card.classList.add("active");
                onSelect(trip);
            });

            // lưu rating nếu cho phép
            if (allowRatingEdit) {
                const btnSave = card.querySelector(".btn-save-rating");
                const inputRating = card.querySelector(".rating-input");

                btnSave.addEventListener("click", async e => {
                    e.stopPropagation();
                    const score = parseInt(inputRating.value, 10);
                    if (isNaN(score) || score < 1 || score > 5) {
                        alert("Điểm rating phải từ 1 đến 5");
                        return;
                    }
                    try {
                        await axios.post("/MainScreen/RouteScreen/updateTrips/", {
                            trip_id: trip.id,
                            title: trip.title,
                            description: trip.description,
                            rating: score,
                        });
                        alert("Lưu đánh giá thành công!");
                        // reload history trips (trip đã đánh giá có thể chuyển sang history)
                        await loadCurrentTrips();
                        await loadHistoryTrips();
                    } catch (err) {
                        console.error("Update_Trip error:", err);
                        alert("Có lỗi khi lưu đánh giá.");
                    }
                });
            }

            container.appendChild(card);
        });
    }

    function renderTripDetail(trip, detailEl, isEditable) {
        if (!trip) {
            detailEl.classList.add("empty");
            detailEl.innerHTML = "<p>Không tìm thấy dữ liệu chuyến đi.</p>";
            return;
        }
        detailEl.classList.remove("empty");

        const ratingText =
            trip.avg_rating >= 0
                ? `${trip.avg_rating.toFixed(1)} / 5 (${trip.rating_count} đánh giá)`
                : "Chưa đánh giá";

        detailEl.innerHTML = `
            <div class="trip-detail-header">
                <div>
                    <h3>${trip.title || "Chuyến đi không tên"}</h3>
                    <div class="trip-detail-rating">
                        <i class="fa-solid fa-star"></i>
                        <span>${ratingText}</span>
                    </div>
                </div>
                <span class="trip-detail-date">${trip.created_at || ""}</span>
            </div>

            <div class="trip-detail-description">
                ${trip.description || "Chưa có mô tả cho chuyến đi này."}
            </div>

            <h4 style="font-size:0.85rem;margin-bottom:4px;">Lộ trình</h4>
            <div class="stops-list">
                ${
                    trip.stops && trip.stops.length
                        ? trip.stops
                              .map(
                                  (st, idx) => `
                    <div class="stop-item">
                        <div class="stop-main">
                            <div class="stop-title-row">
                                <div class="stop-index">${idx + 1}</div>
                                <span><strong>${st.location.name}</strong></span>
                            </div>
                            <div class="stop-meta">
                                <div>${st.location.address || ""}</div>
                                <div>
                                    <i class="fa-regular fa-clock"></i> ${
                                        st.stay || 30
                                    } phút · 
                                    <i class="fa-solid fa-location-dot"></i> 
                                    ${st.location.lat.toFixed(4)}, ${st.location.lon.toFixed(4)}
                                </div>
                            </div>
                        </div>
                    </div>`
                              )
                              .join("")
                        : `<div class="empty-state">Chuyến đi này chưa có điểm dừng nào.</div>`
                }
            </div>
        `;
    }
    (async function init() {
        setActiveTab("current");
        await loadCurrentTrips();
        await loadHistoryTrips();
    })();
});
