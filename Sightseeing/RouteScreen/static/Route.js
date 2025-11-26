document.addEventListener("DOMContentLoaded", () => {
    var PLACES = [
        { 
            id:1, 
            namePlace:"Chợ Bến Thành", 
            lat: 10.7725168, 
            lon: 106.6980208, 
            img:"/static/images/Cho_Ben_Thanh.jpg",
            des: "Tesstttttttt"
        },
        { 
            id:2, 
            namePlace:"Nhà Thờ Đức Bà", 
            lat: 10.7797855, 
            lon: 106.6990189, 
            img:"/static/images/Nha_Tho_Duc_Ba.jpg",
            des: "Testttttt"
        },
        { 
            id:3, 
            namePlace:"Dinh Độc Lập", 
            lat: 10.7769942, 
            lon: 106.6953021, 
            img: "/static/images/Dinh_Doc_Lap.jpg",
            des: "testssssss"
        },
    ];

    var Recommended_Place = [
        // {
        //     namePlace: "Destination1",
        //     img: "/static/images/Dinh_Doc_Lap.jpg",
        // },
        // {
        //     namePlace: "Destination1",
        //     img: "/static/images/Dinh_Doc_Lap.jpg",
        // },
        // {
        //     namePlace: "Destination1",
        //     img: "/static/images/Dinh_Doc_Lap.jpg",
        // },
        // {
        //     namePlace: "Destination1",
        //     img: "/static/images/Dinh_Doc_Lap.jpg",
        // },
        // {
        //     namePlace: "Destination1",
        //     img: "",
        // }
    ];
    let currentMarker;
    let map;

    function initApp(){
        // console.log.table(Recommended_Place);
        initMap();
        updateTripTitleFromURL();
        renderRecommendation(Recommended_Place);
        initCarouseControls();
        searchLocation()


        const itineraryList = renderItinerary(PLACES)
        if (itineraryList){
            initDragAndDrop(itineraryList);
        }

    }

    function initMap(){
        map = L.map('map').setView([10.7757116,106.6979296], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            { attribution:'&copy; OpenStreetMap' }
        ).addTo(map);

        currentMarker = L.marker([10.7757116,106.6979296]).addTo(map).bindPopup('đây là trung tâm').openPopup();
        document.getElementById("info-close").addEventListener("click", () => {
            document.getElementById("map-info-panel").classList.add("hidden");
        });

    }

    function updateTripTitleFromURL(){
        const params = new URLSearchParams(window.location.search);
        const namerepalce = params.get("name");

        const triptitle = document.querySelector(".trip-title h1");
        triptitle.textContent = "";
        triptitle.textContent = namerepalce;
        
        getRecommended_Place(namerepalce)
    }

    function renderRecommendation(places){
        const Add_placesCarousel = document.getElementById("placesCarousel")
        places.forEach((p, idx) => {
            let mediaHTML;
            if (p.img == ""){
                mediaHTML = `
                    <span class="place-placeholder-icon">
                        <i class="fa-solid fa-compass"></i> 
                    </span>
                `;
            }else{
                mediaHTML = `
                    <img src = "${p.img}" alt = ${p.namePlace}>
                `
            }

            const newdiv = document.createElement("div");
            newdiv.className = "place-card";
            newdiv.innerHTML = `
                ${mediaHTML}
                <span class = "place-name"> ${p.namePlace} </span>
                <button class = "add-place-btn"> + </button>
            `;
            const addedButton = newdiv.querySelector(".add-place-btn");
            addedButton.addEventListener("click", () => {
                const rec = Recommended_Place[idx];
                const newId = PLACES.length ? Math.max(...PLACES.map(pl => pl.id)) + 1 : 1;
                PLACES.push({
                    id: newId,
                    namePlace: rec.namePlace,
                    lat: rec.lat || 0,
                    lon: rec.lon || 0,
                    img: rec.img || "/static/images/Nha_Tho_Duc_Ba.jpg",
                    des: rec.des || ""
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
                    <div class = "itinerary-info">
                        <h3> ${p.namePlace} </h3>
                        <p> ${p.des} </p>
                        <div class = "itinerary-meta">
                            <span> 32 min</span>
                            <span>· 16 min </span>
                            <a href="#">Directions</a>
                        </div>
                    </div>
                    <img src = "${p.img}" alt = ${p.namePlace}>

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
                    ${item.display_name}
                </div>
            `).join("");

            sugBox.classList.remove("hidden");

            sugBox.querySelectorAll(".suggestion-item").forEach(el => {
                el.addEventListener("click", () => {
                    const chosen = currentSuggestions[+el.dataset.idx];
                    pickSuggestionFromDB(chosen);
                });
            });
        }

        async function pickSuggestionFromDB(chosen){
            console.log("From DB");
            input.value = chosen.display_name;
            sugBox.classList.add("hidden");

            let lat = parseFloat(chosen.lat);
            let lon = parseFloat(chosen.lon);

            console.log("Picked:", lat, lon, chosen.display_name);
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker([lat, lon]).addTo(map).bindPopup(chosen.display_name);
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
                    name: chosen.display_name.split(",")[0],
                    address: chosen.display_name,
                    lat, lon,
                    weather: tmp
                });
                console.log(w.main.temp, w.main.humidity, w.wind.speed);
                Recommended_Place.push({
                    namePlace: chosen.display_name.split(",")[0],
                    lat: lat,
                    lon: lon, 
                    img: "",
                    des: chosen.display_name,
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
                    namePlace: ans.data.display_name.split(",")[0],
                    lat: lat,
                    lon: lon, 
                    img: "",
                    des: ans.data.display_name,
                });
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

            // else if (event.key === "Enter"){
            //     console.log("Kick enter");
            //     event.preventDefault();
            //     if (activeIndex >= 0){
            //         pickSuggestionFromDB(currentSuggestions[activeIndex]);
            //     }else{
            //         pickSuggestFromInput();
            //     }
            //     return;
            // } 

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
                "limit": 7,
            }
        })
        const dataList = res.data;
        console.table(dataList);

        Recommended_Place = dataList.map(item => ({
            namePlace: item.namePlace,
            lat: parseFloat(item.latitude),
            lon: parseFloat(item.longtitude),
            img: item.image || "",
            des: `Rating: ${item.rating}`
        }));
        
        refreshRecommendationUI();
        
    }

    initApp();
});



