var map = L.map('map').setView([10.762622, 106.660172], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// const A = [10.762622, 106.660172];
// const B = [10.823099, 106.629662];
// const C = [10.776889, 106.700806];

const A = [10.779783, 106.699018]
const B = [10.780150, 106.700804]
const C = [10.772338, 106.698281]
const D = [10.777182, 106.695389]

//L.marker(A).addTo(map).bindPopup("Điểm Nhà Thờ Đức Bà").openPopup;
L.marker(B).addTo(map).bindPopup("Điểm Bưu Điện Trung Tâm Sài Gòn").openPopup;
L.marker(C).addTo(map).bindPopup("Điểm Chợ Bến thành").openPopup;
//L.marker(D).addTo(map).bindPopup("Điểm Dinh Độc Lập".openPopup)

axios.post('/MainScreen/MapScreen/api/route/',
    { coordinates: [ B, C] }, 
    { headers: { 'Content-Type': 'application/json' } }
)
.then(res => {

    console.log('Response:', res.data);

    const encoded = res.data.routes[0].geometry;
    const coords = polyline.decode(encoded);  // giải mã 

    // đảo ngươc lon, lat dể dùng với leaflet
    const latlngs = coords.map(c => [c[0], c[1]]);

    const line = L.polyline(latlngs, {
      color: 'blue',
      weight: 8,
      opacity: 0.8
    }).addTo(map);
    map.fitBounds(line.getBounds());

  })
  .catch(err => console.error('Lỗi khi gọi API', err));