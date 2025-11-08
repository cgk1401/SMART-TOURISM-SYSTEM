  var PLACES = [
    { 
        id:1, 
        name:"Chợ Bến Thành", 
        lat: 10.7725168, 
        lon: 106.6980208, 
          img:"/static/images/Cho_Ben_Thanh.jpg" 
    },
    { 
        id:2, 
        name:"Nhà Thờ Đức Bà", 
        lat: 10.7797855, 
        lon: 106.6990189, 
        img:"/static/images/Nha_Tho_Duc_Ba.jpg" 
    },
    { 
        id:3, 
        name:"Dinh Độc Lập", 
        lat: 10.7769942, 
        lon: 106.6953021, 
        img: "/static/images/Dinh_Doc_Lap.jpg" 
    },
];

const map = L.map('map').setView([PLACES[0].lat, PLACES[0].lon], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap' }).addTo(map);

let routeLayer = null;
const destList = document.getElementById('destList');
const previewImg = document.getElementById('placeImage');

PLACES.forEach((p, idx) => {
    p.marker = L.marker([p.lat, p.lon]).addTo(map).bindPopup(`<b>${p.name}</b>`);
    
    const li = document.createElement('li');
    li.className = 'dest-item';
    
    li.innerHTML = `
        <input type="checkbox" class="sel" data-id="${p.id}">
        <div>
            <div class="name">${idx + 1}. ${p.name}</div>
            <div class="sub">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</div>
        </div>`;
    
    li.addEventListener('click', (e) => {
        if (!e.target.classList.contains('sel')) {
            li.querySelector('.sel').checked = !li.querySelector('.sel').checked;
        }
        
        map.panTo([p.lat, p.lon]); 
        p.marker.openPopup(); 
        previewImg.src = p.img;
    });
    
    destList.appendChild(li);
});

document.getElementById('btnDraw').addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.sel:checked')).map(cb => +cb.dataset.id);
    if (ids.length < 2) { alert('Chọn ít nhất 2 điểm.'); return; }
    if (routeLayer){
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    const coords = ids.map(id => {
    const p = PLACES.find(x => x.id === id);
    return [p.lat, p.lon];
    });

  try {
    const res = await axios.post('/MainScreen/MapScreen/api/route/', 
        { coordinates: coords }, 
        { headers:{'Content-Type':'application/json'} });
    const encoded = res.data.routes[0].geometry;

    const tmp = polyline.decode(encoded);
    const latlngs = tmp.map(c => [c[0], c[1]]);
    
    routeLayer = L.polyline(latlngs, {
        color: 'blue',
        weight: 8,
        opacity: 0.8,
    }
    ).addTo(map);
    map.fitBounds(routeLayer.getBounds());

  } catch (e) {
    console.error(e); alert('Lỗi gọi API.');
  }
});