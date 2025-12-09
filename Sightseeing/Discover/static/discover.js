const map = L.map('map').setView([10.78, 106.69], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

locations.forEach(loc => {
    L.marker([loc.lat, loc.lng])
        .addTo(map)
        .bindPopup(loc.name)
        .on("click", () => showCard(loc.id));
});

document.querySelectorAll('.card').forEach(card => {
    card.addEventListener("click", () => {
        const id = card.id.replace("card", "");
        const loc = locations.find(l => l.id == id);
        map.setView([loc.lat, loc.lng], 16);
    });
});

function showCard(id) {
    document.getElementById(`card${id}`).scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function showDetail(id) {
    const container = document.getElementById("detail-container");
    const loc = locations.find(l => l.id === id);

    container.innerHTML = `
        <div class="detail-card">
            <h2>${loc.name}</h2>
            <p>${loc.fullDescription}</p>
        </div>
    `;

    container.scrollIntoView({ behavior: "smooth" });

    // Center map on click
    map.setView([loc.lat, loc.lng], 16);
}