const map = L.map('map').setView([10.7757116,106.6979296], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution:'&copy; OpenStreetMap' }
).addTo(map);

L.marker([10.7757116,106.6979296]).addTo(map).bindPopup('đây là trung tâm').openPopup();

const params = new URLSearchParams(window.location.search);
const namerepalce = params.get("name");

const triptitle = document.querySelector(".trip-title h1");
triptitle.textContent = "";
triptitle.textContent = namerepalce;

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
]

const tripsection = document.querySelector(".trip-section");
if (PLACES.length != 0){
    tripsection.innerHTML = `
        <h2> Itinerary </h2>
    `
    const newdiv = document.createElement("div");
    newdiv.className = "itinerary-list";

    PLACES.forEach((p, idx) =>{
        const newitineraryItem = document.createElement("div");
        newitineraryItem.className = "itinerary-item";
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

    tripsection.appendChild(newdiv);
}


const container = document.querySelector(".itinerary-list");
let draggedItem = null;

container.querySelectorAll(".itinerary-item").forEach(item => {
    item.setAttribute("draggable", true);

    item.addEventListener("dragstart", () => {
        draggedItem = item;
        item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        draggedItem = null;
        updateIndexes();
    });
});

container.addEventListener("dragover", e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    const dragging = document.querySelector(".dragging");
    if (afterElement == null) {
        container.appendChild(dragging);
    } else {
        container.insertBefore(dragging, afterElement);
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

function updateIndexes() {
    const items = container.querySelectorAll(".itinerary-item");
    items.forEach((item, idx) => {
        const indexDiv = item.querySelector(".itinerary-index");
        if (indexDiv) indexDiv.textContent = idx + 1;
    });
}
