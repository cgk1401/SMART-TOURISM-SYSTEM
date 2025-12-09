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

            let ratingHtml = "";
            if (allowRatingEdit){
                const currentScore = trip.avg_rating > 0 ? Math.round(trip.avg_rating) : 0;
                
                // Tạo 5 ngôi sao
                let starsStr = "";
                for (let i = 1; i <= 5; i++){
                    const activeClass = i <= currentScore ? "active" : "";
                    starsStr += `<i class="fa-solid fa-star star-editable ${activeClass}" data-value="${i}"></i>`;
                }

                ratingHtml = `
                    <div class="rating-input-row">
                        <span>Đánh giá:</span>
                        <div class="star-rating-control" data-rating="${currentScore}">
                            ${starsStr}
                        </div>
                        <button class="btn-save-rating">Lưu</button>
                    </div>
                `
            }else{
                // Nếu là tab lịch sử thì chỉ hiện kết quả
                ratingHtml = trip.avg_rating >= 0 ? 
                `<div class="rating-badge"><i class="fa-solid fa-star"></i>${trip.avg_rating.toFixed(1)} (${trip.rating_count})</div>`
                    : `<div class="rating-badge">Nháp</div>`;
                
            }

            card.innerHTML = `
                <div class="trip-card-main">
                    <div class="trip-card-title-row">
                    ${
                        allowRatingEdit
                            ? `<div
                                class="trip-card-title trip-title-editable"
                                contenteditable="true"
                                spellcheck="false"
                            >${trip.title || ""}</div>`
                            : `<div class="trip-card-title">${trip.title || "Chuyến đi không tên"}</div>`
                        }
                    </div>
                    <div class="trip-card-meta">
                        <span><i class="fa-regular fa-calendar"></i>${createdAt}</span>
                        <span><i class="fa-regular fa-clock"></i>${trip.stops.length} điểm dừng</span>
                    </div>
                </div>
                <div class="trip-card-rating">
                    ${ratingHtml}
                </div>
            `;

            // chọn trip
            card.addEventListener("click", e => {
                // Không active card khi đang bấm rating hoặc sửa tiêu đề
                if (e.target.closest(".rating-input-row") || e.target.closest(".trip-title-editable")) return;

                container
                    .querySelectorAll(".trip-card")
                    .forEach(el => el.classList.remove("active"));
                card.classList.add("active");
                onSelect(trip);
            });

            // lưu rating nếu cho phép
            if (allowRatingEdit) {
                const starControl = card.querySelector(".star-rating-control");
                const btnSave = card.querySelector(".btn-save-rating");
                const inputTitle = card.querySelector(".trip-title-editable");

                if (starControl){
                    const stars = starControl.querySelectorAll(".star-editable");
                    stars.forEach(star => {
                        star.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const val = parseInt(star.dataset.value);
                            starControl.dataset.rating = val;
                            // Cập nhật giao diện
                            stars.forEach(s => {
                                const sVal = parseInt(s.dataset.value);
                                if (sVal <= val) {
                                    s.classList.add("active");
                                } else {
                                    s.classList.remove("active");
                                }
                            })
                        })
                    })
                }
                btnSave.addEventListener("click", async e => {
                    e.stopPropagation();
                    let score = parseInt(starControl.dataset.rating);

                    if (score === 0) {
                        alert("Vui lòng chọn số sao để đánh giá!");
                        return; 
                    }

                    const newTitleRaw = inputTitle ? inputTitle.innerText.trim() : "";
                    const newTitle = newTitleRaw || trip.title || ""; // Nếu rỗng thì dùng lại trip cũ
                    try {
                        await axios.post("/MainScreen/RouteScreen/updateTrips/", {
                            trip_id: trip.id,
                            title: newTitle,
                            description: trip.description,
                            rating: score,
                        });
                        alert("Lưu đánh giá thành công!");
                        // reload history trips (trip đã đánh giá có thể chuyển sang history)
                        trip.title = newTitle;
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
