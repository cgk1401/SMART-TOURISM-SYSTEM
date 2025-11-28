document.addEventListener('DOMContentLoaded', function() {
    loadTrips();
    loadCustomize();


    document.querySelector('.hero__btn').addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('#discover').scrollIntoView({ behavior: 'smooth' });
        }
    );
});

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
                            <a href="detailsRoute/${trip.id}/" class="btn-text">View Details <i class="fa-solid fa-arrow-right"></i></a>
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
        });
}