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