var map = L.map('map').setView([10.762622, 106.660172], 20);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(map); 

L.marker([10.762622, 106.660172])
    .addTo(map)
    .bindPopup('Đây là vị trí trung tâm TP.HCM')
    .openPopup();