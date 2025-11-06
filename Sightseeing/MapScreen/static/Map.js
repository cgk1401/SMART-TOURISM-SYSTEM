var PLACES = [
    [
        { id: 1, name: "Ben Thanh Market", lat: 10.7725168, lon: 106.6980208, img: "/static/images/Ben_Thanh_Market.jpg" },
        { id: 2, name: "Notre Dame", lat: 10.7797855, lon: 106.6990189, img: "/static/images/Notre_Dame.jpg" },
        { id: 3, name: "Independence Palace", lat: 10.7769942, lon: 106.6953021, img: "/static/images/Independence_Palace.jpg" }
    ],
    [
        { id: 1, name: "Bitexco Financial Tower", lat: 10.77171, lon: 106.70437, img: "/static/images/Bitexco_Financial_Tower.jpg" },
        { id: 2, name: "Fine Arts Museum", lat: 10.77006, lon: 106.69927, img: "/static/images/Fine_Arts_Museum.jpg" },
        { id: 3, name: "HCMC Museum", lat: 10.77606, lon: 106.69955, img: "/static/images/HCMC_Museum.jpg" }
    ],
    [
        { id: 1, name: "Giac Lam Pagoda", lat: 10.77871, lon: 106.64919, img: "/static/images/Giac_Lam_Pagoda.jpg" },
        { id: 2, name: "Jade Emperor Pagoda", lat: 10.79199, lon: 106.69818, img: "/static/images/Jade_Emperor_Pagoda.jpg" },
        { id: 3, name: "Vietnamese National Pagoda", lat: 10.77213, lon: 106.67335, img: "/static/images/Vietnamese_National_Pagoda.jpg" }

    ],
    [
        { id: 1, name: "Landmark 81", lat: 10.79511, lon: 106.72209, img: "/static/images/Landmark_81.jpg" },
        { id: 2, name: "Nguyen Hue Walking Street", lat: 10.77307, lon: 106.70474, img: "/static/images/Nguyen_Hue_Walking_Street.jpg" },
        { id: 3, name: "Saigon Opera House", lat: 10.77661, lon: 106.70317, img: "/static/images/Saigon_Opera_House.jpg" }
    ]
];

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('panels-container');
    const template = document.getElementById('panel-template').content;

    PLACES.forEach((placeList, index) => {
        const panel = template.cloneNode(true);
        container.appendChild(panel);

        initPanel(index, container.lastElementChild, placeList);
    });
});

function initPanel(index, wrap, places) {
    const mapEl = wrap.querySelector('.map');
    const destList = wrap.querySelector('.dest-list');
    const previewImg = wrap.querySelector('.place-image');
    const drawBtn = wrap.querySelector('.draw-btn');

    const mapId = `map-${index}`;
    mapEl.id = mapId;

    const map = L.map(mapId).setView([places[0].lat, places[0].lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    let routeLayer = null;

    function deletePlace(id) {
        if (!confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
        const idx = places.findIndex(p => p.id === id);
        if (idx === -1) return;
        if (places[idx].marker) map.removeLayer(places[idx].marker);
        places.splice(idx, 1);
        
        destList.innerHTML = '';
        places.forEach((p, i) => {
            const li = document.createElement('li');
            li.className = 'dest-item';
            li.dataset.id = p.id;
            li.innerHTML = `
            <input type="checkbox" class="sel" data-id="${p.id}">
            <div>
                <div class="name">${i + 1}. ${p.name}</div>
                <div class="sub">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</div>
            </div>
            <button class="delete-btn" data-id="${p.id}">X</button>
        `;
            li.addEventListener('click', e => {
                if (e.target.classList.contains('delete-btn')) {
                    deletePlace(p.id);
                } else if (!e.target.classList.contains('sel')) {
                    li.querySelector('.sel').checked = !li.querySelector('.sel').checked;
                } else {
                    return;
                }
                map.panTo([p.lat, p.lon]);
                p.marker.openPopup();
                previewImg.src = p.img;
            });
            destList.appendChild(li);
        });
        if (places.length > 0) {
            previewImg.src = places[0].img;
            map.panTo([places[0].lat, places[0].lon]);
        } else {
            previewImg.src = '{% static "images/HCMUS.jpg" %}';
        }
        map.invalidateSize();
    }

    places.forEach((p, i) => {
        p.marker = L.marker([p.lat, p.lon]).addTo(map).bindPopup(`<b>${p.name}</b>`);

        const li = document.createElement('li');
        li.className = 'dest-item';
        li.dataset.id = p.id;
        li.innerHTML = `
            <input type="checkbox" class="sel" data-id="${p.id}">
            <div>
                <div class="name">${i + 1}. ${p.name}</div>
                <div class="sub">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</div>
            </div>
            <button class="delete-btn" data-id="${p.id}">X</button>
        `;

        li.addEventListener('click', e => {
            if (e.target.classList.contains('delete-btn')) {
                deletePlace(p.id);
            } else if (!e.target.classList.contains('sel')) {
                li.querySelector('.sel').checked = !li.querySelector('.sel').checked;
            } else {
                return;
            }
            map.panTo([p.lat, p.lon]);
            p.marker.openPopup();
            previewImg.src = p.img;
        });

        destList.appendChild(li);
    });

    drawBtn.addEventListener('click', async () => {
        const checked = destList.querySelectorAll('.sel:checked');
        const ids = Array.from(checked).map(cb => +cb.dataset.id);
        if (ids.length < 2) { alert('Chọn ít nhất 2 điểm.'); return; }

        if (routeLayer) map.removeLayer(routeLayer);

        const coords = ids.map(id => {
            const p = places.find(x => x.id === id);
            return [p.lat, p.lon];
        });

        try {
            const res = await axios.post('/MainScreen/MapScreen/api/route/', { coordinates: coords }, {
                headers: { 'Content-Type': 'application/json' }
            });
            const encoded = res.data.routes[0].geometry;
            const latlngs = polyline.decode(encoded).map(c => [c[0], c[1]]);

            routeLayer = L.polyline(latlngs, { color: 'blue', weight: 8, opacity: 0.8 }).addTo(map);
            map.fitBounds(routeLayer.getBounds());
        } catch (e) {
            console.error(e);
            alert('Lỗi gọi API.');
        }
    });

    // Optional optimization
    setTimeout(() => map.invalidateSize(), 100);
    window.addEventListener('resize', () => setTimeout(() => map.invalidateSize(), 100));
}