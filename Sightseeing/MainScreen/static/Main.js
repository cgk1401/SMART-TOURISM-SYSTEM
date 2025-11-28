document.addEventListener('DOMContentLoaded', function() {
    loadTrips();
    loadCustomize();
    setupModalEvents();

    document.querySelector('.hero__btn').addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('#discover').scrollIntoView({ behavior: 'smooth' });
        }
    );
});

let currentTripId = null;

function loadCustomize(){
    const customizeButton = document.querySelector(".btn-primary");

    if (customizeButton){
            customizeButton.addEventListener("click", () => {
            window.location.href = "/PreferenceScreen/";
        })
    }
}

function loadTrips() {
    const container = document.getElementById('trip-list-container');
    
    axios.get('api/trips/')
        .then(function (response) {
            const trips = response.data;
            
            container.innerHTML = '';

            if (trips.length === 0) {
                container.innerHTML = '<p>No trips found.</p>';
                return;
            }

            let htmlContent = '';
            
            trips.forEach(trip => {
                htmlContent += `
                <div class="trip-card">
                    <div class="trip-card__image">
                        <img src="${trip.image_url}" alt="${trip.title}">
                        <span class="trip-tag">1 Day</span>
                    </div>
                    
                    <div class="trip-card__content">
                        <div class="trip-meta">
                            <span class="rating">
                                <i class="fa-solid fa-star"></i> ${trip.avg_rating.toFixed(1)}
                            </span>
                            <span class="reviews">(${trip.rating_count} reviews)</span>
                        </div>
                        
                        <h3 class="trip-title">${trip.title}</h3>
                        <p class="trip-desc">
                            ${trip.description ? trip.description.substring(0, 80) + '...' : ''}
                        </p>
                        
                        <div class="trip-footer">
                            <div class="trip-info">
                                <i class="fa-solid fa-location-dot"></i> ${trip.stop_count} Stops
                            </div>
                            <button class="btn-text" onclick="openTripDetails('${trip.id}')">
                                View Details <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });
            container.innerHTML = htmlContent;
        })
        .catch(function (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
            container.innerHTML = '<p style="color:red">Failed to load trips.</p>';
        }
    );
}

function openTripDetails(tripId){
    currentTripId = tripId;

    const modal = document.getElementById('trip-modal');
    const stopsContainer = document.getElementById('modal-stops');

    stopsContainer.innerHTML = `
        <div style="text-align:center; padding:20px;">Loading itinerary...</div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    axios.get(`detailsRoute/${tripId}/`).then(function (response){
        const data = response.data;

            document.getElementById('modal-title').innerText = data.title;
            document.getElementById('modal-desc').innerText = data.description;
            document.getElementById('modal-rating').innerText = data.avg_rating;
            document.getElementById('modal-stop-count').innerText = data.stops.length;

            let stopsHtml = '';
            // sap theo thu tu neu stops chua sap xep
            const sortedStops = data.stops.sort((a, b) => a.order - b.order);
            sortedStops.forEach(stop => {
                stopsHtml += `
                <div class="timeline-item" data-order="${stop.order}">
                    <div class="stop-name">${stop.location.name}</div>
                    <div class="stop-address"><i class="fa-solid fa-map-pin"></i> ${stop.location.address}</div>
                    <div class="stop-meta">
                        <i class="fa-regular fa-clock"></i> Stay: ${stop.stay} mins
                    </div>
                </div>
                `;
            });

            stopsContainer.innerHTML = stopsHtml;

        }
    ).catch(function (error) {
            console.error('Error loading details:', error);
            stopsContainer.innerHTML = '<p style="color:red">Failed to load trip details.</p>';
        }
    );
}

function setupModalEvents(){
    const modal = document.getElementById('trip-modal');
    const closeBtn = document.getElementById('close-modal');
    const useTripBtn = document.getElementById('btn-use-trip');

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Mở lại cuộn trang
    }

    closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    useTripBtn.addEventListener('click', function() {
        if (currentTripId) {
            //  Chuyển sang trang RouteScreen
            //window.location.href = `/RouteScreen/${currentTripId}/`; 
            window.location.href = `/MainScreen/`;
        }
    });
}