document.addEventListener("DOMContentLoaded", () => {
    var PLACES = [
        // id(để kéo di chuyển các place) pk, name, lat, lon, address không có thì để tên, stay
    ];

    var Recommended_Place = [
        // name, lat(float), lon(float), rating, address, stay, tags, pk
    ];
    let currentMarker;
    let map;
    let routeLayer;
    let routeMarkersGroup = L.layerGroup();
    let TripName;
    

    function initApp(){
        // console.log.table(Recommended_Place);
        initMap();
        getTripFromUrl();
        // updateTripTitleFromURL();
        renderRecommendation(Recommended_Place);
        initCarouseControls();
        searchLocation();
        renderRoute();
        clearMap();
        SaveTrip();

        const itineraryList = renderItinerary(PLACES)
        if (itineraryList){
            initDragAndDrop(itineraryList);
        }

    }

    function initMap(){
        const mapElement = document.getElementById('map');
        const MAP_KEY = mapElement.getAttribute('data-key');

        const streetLayer = L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAP_KEY}`, {
            attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 20
        });

        const satelliteLayer = L.tileLayer(`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_KEY}`, {
            attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 20
        });

        map = L.map('map', {
            center: [10.775844, 106.701753],
            zoom: 12,
            layers: [streetLayer]
        });

        // Tạo nút chuyển đổi hai chế độ map

        const baseMaps = {
            "Bản đồ thường": streetLayer,
            "Vệ tinh": satelliteLayer
        };

        L.control.layers(baseMaps).addTo(map);
        
        currentMarker = L.marker([10.7757116,106.6979296]).addTo(map).bindPopup('Trung Tâm Thành Phố').openPopup();
        
        document.getElementById("info-close").addEventListener("click", () => {
            document.getElementById("map-info-panel").classList.add("hidden");
        });

    }

    // function updateTripTitleFromURL(){
    //     const params = new URLSearchParams(window.location.search);
    //     const namerepalce = params.get("name");

    //     const triptitle = document.querySelector(".trip-title h1");
    //     triptitle.textContent = "";
    //     triptitle.textContent = namerepalce;
        
    //     getRecommended_Place(namerepalce)
    // }

    function renderRecommendation(places){
        const Add_placesCarousel = document.getElementById("placesCarousel")
        Add_placesCarousel.innerHTML = "";

        if(!places || places.length === 0) {
            Add_placesCarousel.innerHTML = '<div class="empty-state">No recommendations available</div>';
            return;
        }

        places.forEach((p, idx) => {
            const rating = p.rating ? p.rating : (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);

            const newdiv = document.createElement("div");
            newdiv.className = "place-card";

            newdiv.innerHTML = `
                <div class="card-image-wrapper">
                    <button class="add-place-btn" title="Add to Itinerary">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <div class="card-content">
                    <h4 class="place-name" title="${p.name}"> ${p.name} </h4>
                    <div class="place-meta">
                        <span class="rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                        <span class="category">Tourist Attraction</span>
                    </div>
                    <p class="place-desc-short" title="${p.address || ''}">${p.address || 'Địa điểm tham quan nổi bật'}</p>
                </div>
            `;
            const addedButton = newdiv.querySelector(".add-place-btn");
            addedButton.addEventListener("click", (e) => {
                e.stopPropagation();
                
                // Hiệu ứng click visual
                addedButton.innerHTML = '<i class="fa-solid fa-check"></i>';
                addedButton.classList.add("added");
                setTimeout(() => {
                    addedButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
                    addedButton.classList.remove("added");
                }, 1500);

                const rec = Recommended_Place[idx];
                const newId = PLACES.length ? Math.max(...PLACES.map(pl => pl.id)) + 1 : 1;
                PLACES.push({
                    id: newId, // Id đùng để kéo thả chỉnh sửa thứ tự lộ trình,
                    pk: rec.pk, // các pk đặc trưng riêng cho từng điểm lưu vào db
                    name: rec.name,
                    lat: rec.lat,
                    lon: rec.lon,
                    address: rec.address || rec.name,
                    stay: rec.stay || "",
                });

                const itineraryList = renderItinerary(PLACES);
                if (itineraryList){
                    initDragAndDrop(itineraryList);
                }
            });
            Add_placesCarousel.appendChild(newdiv);
        })
        return Add_placesCarousel;
    }

    function initCarouseControls(){
        const carousel = document.getElementById("placesCarousel");
        const scrollRightbtn = document.getElementById("scrollRightBtn");
        const scrollLeftbtn = document.getElementById("scrollLeftBtn");
        const scrollAmount = 250;

        if (!carousel || !scrollLeftbtn || !scrollRightbtn){
            return;
        }

        const updateArrowVisibility = () => {
            if (carousel.scrollLeft > 0){
                scrollLeftbtn.style.display = 'flex';
            }else{
                scrollLeftbtn.style.display = 'none';
            }

            const isAtEnd = carousel.scrollWidth - carousel.scrollLeft <= carousel.clientWidth + 1;
            if (isAtEnd) {
                scrollRightbtn.style.display = 'none';
            } else {
                scrollRightbtn.style.display = 'flex';
            }
        }

        if (scrollRightbtn){
            scrollRightbtn.addEventListener('click', () => {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            })
        }

        if (scrollLeftbtn){
            scrollLeftbtn.addEventListener('click', () => {
                carousel.scrollBy({left: -scrollAmount, behavior: 'smooth'})
            })
        }

        carousel.addEventListener('scroll', updateArrowVisibility);
        updateArrowVisibility();
    }

    function renderItinerary(place){
        const container = document.getElementById("destination-route");
        container.innerHTML = `
                <h2> Itinerary </h2>
            `
            const newdiv = document.createElement("div");
            newdiv.className = "itinerary-list";

            place.forEach((p, idx) =>{
                const newitineraryItem = document.createElement("div");
                newitineraryItem.className = "itinerary-item";
                newitineraryItem.setAttribute("draggable", true);
                newitineraryItem.dataset.id = p.id;

                newitineraryItem.innerHTML = `
                    <div class = "itinerary-index"> ${idx + 1} </div>

                    <div class="itinerary-icon-placeholder">
                        <i class="fa-solid fa-landmark"></i>
                    </div>

                    <div class = "itinerary-info">
                        <h3> ${p.name} </h3>
                        <p> ${p.address || p.name} </p>

                        <div class="itinerary-meta">
                            <span><i class="fa-regular fa-clock"></i> ${(p.stay || 30) + " mins"}</span>
                        </div>

                    </div>

                    <button class = "delete-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                `;
                newdiv.appendChild(newitineraryItem);

                const deletedButton = newitineraryItem.querySelector(".delete-btn");
                deletedButton.addEventListener("click", () => {
                    const iddeleted = parseInt(newitineraryItem.dataset.id);

                    PLACES = PLACES.filter(p => p.id != iddeleted);
                    const itineraryList = renderItinerary(PLACES);
                    if (itineraryList){
                        initDragAndDrop(itineraryList);
                    }
                })
            })
        container.appendChild(newdiv);
        return newdiv;
    }

    function initDragAndDrop(container){
        let draggedItem = null;

        container.addEventListener("dragstart", e => {
            if (e.target.classList.contains("itinerary-item")) {
                draggedItem = e.target;
                setTimeout(() => {
                    e.target.classList.add("dragging");
                }, 0);
            }
        });

        container.addEventListener("dragend", e => {
            if (e.target.classList.contains("itinerary-item")) {
                e.target.classList.remove("dragging");
                draggedItem = null;
                updateIndexes(container); // cập nhật
                syncArrayWithDOM(container);
            }
        });

        container.addEventListener("dragover", e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY);
            
            if (draggedItem) { 
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            }
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll(".itinerary-item:not(.dragging)")];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function updateIndexes(container) {
            const items = container.querySelectorAll(".itinerary-item");
            items.forEach((item, idx) => {
                const indexDiv = item.querySelector(".itinerary-index");
                if (indexDiv) indexDiv.textContent = idx + 1;
            });
        }

        function syncArrayWithDOM(container){
            const orderedIds = [...container.querySelectorAll(".itinerary-item")].map(item => parseInt(item.dataset.id));
            const sortPlaces = orderedIds.map(id => {
                return PLACES.find(p => p.id == id);
            })
            PLACES = sortPlaces;
            // console.clear();
            console.table(PLACES);
        }
    }
    
    function searchLocation(){
        const input = document.getElementById("Search-location");
        const sugBox = document.getElementById("search-suggestions");
        const MIN_CHARS = 2;
        const DEBOUNCE_MS = 120;

        let debounceTimer = null;
        let activeIndex = -1;
        let currentSuggestions = [];

        async function fetchSuggestions(query){
            const res = await axios.get("autocomplete/", {
                params: { q: query }
            });
            return res.data || [];
        }

        function renderSuggestions(list){
            currentSuggestions = list;
            activeIndex = -1;

            if (!list.length){
                sugBox.classList.add("hidden");
                sugBox.innerHTML = "";
                return;
            }

            sugBox.innerHTML = list.map((item, idx) => `
                <div class="suggestion-item" data-idx="${idx}">
                    ${item.name}
                </div>
            `).join("");

            sugBox.classList.remove("hidden");

            sugBox.querySelectorAll(".suggestion-item").forEach(el => {
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const chosen = currentSuggestions[+el.dataset.idx];
                    pickSuggestionFromDB(chosen);
                });
            });
        }

        async function pickSuggestionFromDB(chosen){
            console.log("From DB");
            input.value = chosen.name;
            sugBox.classList.add("hidden");

            let lat = parseFloat(chosen.lat);
            let lon = parseFloat(chosen.lon);

            console.log("Picked:", lat, lon, chosen.name);
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker([lat, lon]).addTo(map).bindPopup(chosen.name);
            map.setView([lat, lon], 15);

            try{
                const weather = await axios.get("getWeather/", { 
                    params:{ lat, lon }
                });
                const w = weather.data;
                const tmp = {
                    temp: w.main?.temp,
                    humidity: w.main?.humidity,
                    wind: w.wind?.speed,
                    desc: w.weather?.[0]?.description
                }
                showInfoPanel({
                    name: chosen.name.split(",")[0],
                    address: chosen.address || chosen.name,
                    lat, lon,
                    weather: tmp
                });
                console.log(w.main.temp, w.main.humidity, w.wind.speed);
                Recommended_Place.push({
                    pk: chosen.pk,
                    name: chosen.name.split(",")[0],
                    lat: lat,
                    lon: lon,
                    rating: chosen.rating || "",
                    address: chosen.address || chosen.name
                });

                refreshRecommendationUI();
            }catch(err){
                console.error("Lỗi lấy thời tiết:", err);
            }
        }

        async function pickSuggestFromInput(){
            console.log("From Input");
            const query = input.value.trim();

            if (query == ""){
                console.log("Thieu input")
                return;
            }

            try{
                const ans = await axios.get("getLocation/", {
                    params:{
                        q: query
                    }
                })
                let lat = parseFloat(ans.data.lat);
                let lon = parseFloat(ans.data.lon);

                if (currentMarker){
                    map.removeLayer(currentMarker);
                }
                currentMarker = L.marker([lat,lon]).addTo(map).bindPopup(ans.data.display_name)
                map.setView([lat, lon], 15);

                console.log(lat)
                console.log(lon)
                console.log(ans.data.display_name)
                // check pk của địa điểm (place_id)
                console.log(ans)

                try{
                const weather = await axios.get("getWeather/",{
                    params:{
                        lat: lat,
                        lon: lon
                    }
                })

                const w = weather.data;
                showInfoPanel({
                    name: ans.data.display_name.split(",")[0],
                    address: ans.data.display_name,
                    lat, lon,
                    weather: {
                        temp: w.main?.temp,
                        humidity: w.main?.humidity,
                        wind: w.wind?.speed,
                        desc: w.weather?.[0]?.description
                    }
                });
                
                console.log(w.main.temp, w.main.humidity, w.wind.speed);
                Recommended_Place.push({
                    pk: ans.data.place_id,
                    name: ans.data.display_name.split(",")[0],
                    lat: lat,
                    lon: lon, 
                    rating: "", //search data không có rating
                    address: ans.data.display_name,
                });
                // console.log(Recommended_Place)
                refreshRecommendationUI();
                
                }catch(err){
                    console.error("Loi lay du lieu thoi tiet:", err)
                }

            }catch(err){
                console.error("Loi lay du lieu vi tri:",err);
            }
        }

        input.addEventListener("input", () =>{
            const query = input.value.trim();
            clearTimeout(debounceTimer);

            if (query.length < MIN_CHARS){
                sugBox.classList.add("hidden");
                sugBox.innerHTML = "";
                return;
            }

            debounceTimer = setTimeout(async () => {
                try{
                    const list = await fetchSuggestions(query);
                    renderSuggestions(list);
                }catch(e){
                    console.error("Autocomplete error:", e);
                    sugBox.classList.add("hidden");
                    }
            }, DEBOUNCE_MS);
        });

        input.addEventListener("keydown", (event) =>{
            if (event.key === "Enter"){
                console.log("Kick Enter");
                event.preventDefault();

                if (!sugBox.classList.contains("hidden") && activeIndex >= 0){
                    pickSuggestionFromDB(currentSuggestions[activeIndex]);
                }
                else{
                    pickSuggestFromInput();
                }
                return;
            }
            if (sugBox.classList.contains("hidden")) return;
            const items = [...sugBox.querySelectorAll(".suggestion-item")];
            
            if (event.key === "ArrowDown"){
                event.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
            } 
            else if (event.key === "ArrowUp"){
                event.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
            } 
            else if (event.key === "Escape"){
                sugBox.classList.add("hidden");
                return;
            }

            items.forEach(i => i.classList.remove("active"));
            if (activeIndex >= 0) items[activeIndex].classList.add("active");
        });

        document.addEventListener("click", (e) => {
            if (!sugBox.contains(e.target) && e.target !== input){
            sugBox.classList.add("hidden");
            }
        });
    }

    function showInfoPanel({name, address, lat, lon, weather}){
        const panel = document.getElementById("map-info-panel");
        document.getElementById("info-name").textContent = name || "---";
        document.getElementById("info-address").textContent = address || "";
        document.getElementById("info-coord").textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

        if (weather){
            document.getElementById("info-temp").textContent = weather.temp ?? "--";
            document.getElementById("info-humidity").textContent = weather.humidity ?? "--";
            document.getElementById("info-wind").textContent = weather.wind ?? "--";
            document.getElementById("info-desc").textContent = weather.desc ?? "--";
        }

        panel.classList.remove("hidden");
    }

    function refreshRecommendationUI(){
        const wrapper = document.getElementById("placesCarousel");
        wrapper.innerHTML = ""; 
        renderRecommendation(Recommended_Place);
    }

    async function getRecommended_Place(name){
        const res = await axios.get("get_similar_location/", {
            params:{
                "base_location": name,
                "limit": 3,
            }
        })
        const dataList = res.data;
        console.table(dataList);

        Recommended_Place = dataList.map(item => ({
            pk: item.pk, // lấy pk từ db
            name: item.name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            rating: item.rating,
            address: item.address || "",
        }));
        
        refreshRecommendationUI();
        
    }

    function renderRoute(){
        const buttonDrawRoute = document.getElementById("btn-draw-route");

        if (!buttonDrawRoute) return;

        routeMarkersGroup.addTo(map);

        buttonDrawRoute.addEventListener('click', async() => {
            if (PLACES.length < 2){
                return;
            }

            const coordsToSend = PLACES.map(p => [p.lat, p.lon]);

            if (routeLayer){
                map.removeLayer(routeLayer);
                routeLayer = null;
            }
            if (currentMarker){
                map.removeLayer(currentMarker);
            }
            routeMarkersGroup.clearLayers();
            PLACES.forEach((p, idx) => {
                const icon = L.divIcon({
                    html: `<div class="route-index-marker">${idx + 1}</div>`,
                    className: "route-index-icon",
                    iconSize: [24, 24]
                });

                const marker = L.marker([p.lat, p.lon], { icon }).bindPopup(`<b>${p.name}</b>`);
                routeMarkersGroup.addLayer(marker);
            });

            const res = await axios.post('getRoute/', {
                coordinates: coordsToSend
            })

            const encoded = res.data.routes[0].geometry;
            
            const tmp = polyline.decode(encoded);
            const latlngs = tmp.map(c => [c[0], c[1]]);
            
            routeLayer = L.polyline(latlngs, {
                    color: 'blue',
                    weight: 6,
                    opacity: 0.8,
                }).addTo(map);

            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

        })
    }

    function clearMap(){
        const buttonClearMap = document.getElementById("btn-clear-map");

        if (!buttonClearMap){
            return;
        }

        buttonClearMap.addEventListener('click', () => {
            if (routeLayer){
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
            if (currentMarker){
                map.removeLayer(currentMarker);
                currentMarker = null;
            }

            routeMarkersGroup.clearLayers();

            map.setView([10.7757116,106.6979296], 12);
            document.getElementById("map-info-panel").classList.add("hidden");
                
            console.log("Map cleared!");
        }) 
    }

    function getTripFromUrl(){
        const params = new URLSearchParams(window.location.search);
        const trip_id = params.get("trip_id");
        const from_preference = params.get("from_preference");
        
        console.log("trip_id = ", trip_id);
        if (trip_id){
            axios.get(`getdetailsRoute/${trip_id}/`).then(res => {
            console.log("Route details:", res.data);
            TripName = res.data.title;
            const triptitle = document.querySelector(".trip-title h1");
            triptitle.textContent = "";
            triptitle.textContent = TripName;

            console.log(res.data.stops[0].location.name);

            res.data.stops.forEach(p => {
                PLACES.push(
                    {
                        id : CreateIdFromRouteTrip(),
                        pk: p.location.pk,
                        name: p.location.name,
                        lat: p.location.lat,
                        lon: p.location.lon,
                        address: p.location.address || p.location.name,
                        stay: p.stay,

                    }
                )
            })
            renderItinerary(PLACES);
            getRecommended_Place(res.data.stops[0].location.name);

            const itineraryList = renderItinerary(PLACES);
            if (itineraryList) {
                initDragAndDrop(itineraryList);
            }
            }).catch(err => {
                console.error("Lỗi lấy trip từ trip_id:", err);
            })
        }else if (from_preference === "true"){
            axios.get(`test-hardcoded-route/`).then(res => {
            console.log("Route details from session:", res.data);
            TripName = res.data.title || "Draft Trip from Preference";
            const triptitle = document.querySelector(".trip-title h1");
            triptitle.textContent = "";
            triptitle.textContent = TripName;

            res.data.stops.forEach(p => {
                PLACES.push({
                    id: CreateIdFromRouteTrip(),
                    pk: p.pk,
                    name: p.name,
                    lat: p.lat,
                    lon: p.lon,
                    address: p.address || p.name,
                    stay: p.stay || 30,
                });
            });
            
            renderItinerary(PLACES);
            if (res.data.stops.length > 0) {
                getRecommended_Place(res.data.stops[0].name);
            }

            const itineraryList = renderItinerary(PLACES);
            if (itineraryList) {
                initDragAndDrop(itineraryList);
            }
            }).catch(err => {
                console.error("Lỗi lấy itinerary từ session:", err);
            });
        }


    }

    function CreateIdFromRouteTrip(){
        if(!PLACES.length) return 1;
        return Math.max(...PLACES.map(p => p.id || 0)) + 1; 
    }

    function SaveTrip(){
        const btnSaveTrip = document.getElementById('btn-save-trip');
        const modalOverlay = document.getElementById('save-modal');
        const btnCloseModal = document.getElementById('btn-modal-close');

        function showSaveModal() {
            if(modalOverlay) {
                modalOverlay.classList.remove('hidden');
            }
        }

        function closeSaveModal() {
            if(modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        }
        if (btnSaveTrip) {
            btnSaveTrip.addEventListener('click', event => {
                event.preventDefault();
                console.log("BẮT ĐẦU SAVE");
                if (!PLACES || PLACES.length === 0){
                    alert("Lội trình đang trống| Vui lòng thêm địa điểm trước khi Lưu");
                    return;
                }
                //format lại dữ liệu trước khi lưu
                const savedData = {
                    // các thông tin title, description, avg_rating, rating_count qua trang mytrip người dùng nhập
                    // có tên nếu là default Trip còn không thì lấy tên mặc định, qua My trip chỉnh sửa
                    title: TripName || "Trip " + new Date().toLocaleString(),
                    description: "Draft trip from map",
                    avg_rating: -1,
                    rating_count: 0,
                    stops: PLACES.map((p, i) => ({
                        pk: p.pk, // pk lấy của điểm trong db hoặc điểm mới từ thanh search
                        name: p.name,
                        lat: p.lat,
                        lon: p.lon,
                        address: p.address,
                        rating: p.rating || 4.5,
                        tags: p.tags || {},
                        stay: p.stay || 30,
                        order: i + 1,
                    }))

                }
                axios.post("SaveTrip/", savedData, {
                    headers:{
                        "Content-Type": "application/json"
                    }
                }).then(res => {
                    console.log("Saved!", res.data);
                }).catch(err => {
                    console.error("Save failed:", err);
                })
                showSaveModal();
            });
        }

        if (btnCloseModal) {
            btnCloseModal.addEventListener('click', event => {
                closeSaveModal();
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', event => {
                if (event.target === modalOverlay) {
                    closeSaveModal();
                }
            });
        }

    }

    initApp();
});



