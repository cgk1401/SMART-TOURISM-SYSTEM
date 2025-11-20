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
        {
            namePlace: "Destination1",
            img: "/static/images/Dinh_Doc_Lap.jpg",
        },
        {
            namePlace: "Destination1",
            img: "/static/images/Dinh_Doc_Lap.jpg",
        },
        {
            namePlace: "Destination1",
            img: "/static/images/Dinh_Doc_Lap.jpg",
        },
        {
            namePlace: "Destination1",
            img: "/static/images/Dinh_Doc_Lap.jpg",
        },
        {
            namePlace: "Destination1",
            img: "",
        }
    ];

    function initApp(){
        initMap();
        updateTripTitleFromURL();
        renderRecommendation(Recommended_Place);
        initCarouseControls();

        const itineraryList = renderItinerary(PLACES)
        if (itineraryList){
            initDragAndDrop(itineraryList);
        }
    }

    function initMap(){
        const map = L.map('map').setView([10.7757116,106.6979296], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            { attribution:'&copy; OpenStreetMap' }
        ).addTo(map);

        L.marker([10.7757116,106.6979296]).addTo(map).bindPopup('đây là trung tâm').openPopup();
    }

    function updateTripTitleFromURL(){
        const params = new URLSearchParams(window.location.search);
        const namerepalce = params.get("name");

        const triptitle = document.querySelector(".trip-title h1");
        triptitle.textContent = "";
        triptitle.textContent = namerepalce;
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
            `
            Add_placesCarousel.appendChild(newdiv);
        })
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
                `
                newdiv.appendChild(newitineraryItem);
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
    }

    initApp();
});



