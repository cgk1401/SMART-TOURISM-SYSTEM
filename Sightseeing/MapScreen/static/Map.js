const map = L.map('map').setView([10.775844, 106.701753], 12);

// Thêm lớp bản đồ (Tile Layer) từ OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let lat, lon

document.addEventListener("DOMContentLoaded", function(){
    const input = document.getElementById("location-search");
    const buttonSearch = document.getElementById("search-button");
    const tempElement = document.getElementById("weather-temp");
    const humidityElement = document.getElementById("weather-humidity");
    const windElement = document.getElementById("weather-wind");
    const addressElement = document.getElementById("search-address");
    const latElement = document.getElementById("lat")
    const lonElement = document.getElementById("lon")


    buttonSearch.addEventListener("click", async function () {
        const query = input.value.trim();

        if (!query){
            alert("Thieu input")
            return;
        }

        try{
            const ans = await axios.get("getLocation/", {
                params:{
                    q: query
                }
            })
            lat = parseFloat(ans.data.lat);
            lon = parseFloat(ans.data.lon);

            L.marker([lat, lon]).addTo(map).bindPopup(ans.data.display_name).openPopup();
            map.setView([lat, lon], 15);

            const weather = await axios.get("getWeather/", {
                params: {
                    lat: lat,
                    lon: lon
                }
            });

            HCMC_data = weather.data;

            address = ans.data.display_name,
            temperature = HCMC_data["main"]["temp"]
            humidity = HCMC_data["main"]["humidity"]
            wind_speed = HCMC_data["wind"]["speed"]


            const shortName = ans.data.display_name.split(',')[0].trim(); 
        
            addressElement.innerHTML = `
                <div class="address-name">${shortName}</div>
                <div class="address-detail">${ans.data.display_name}</div>
            `;
            latElement.innerHTML = `<strong>Vĩ Độ:</strong> ${lat.toFixed(5)}°`;
            lonElement.innerHTML = `<strong>Kinh Độ:</strong> ${lon.toFixed(5)}°`;
            tempElement.innerHTML = `<strong>Nhiệt độ:</strong> ${temperature}°C`;
            humidityElement.innerHTML = `<strong>Độ ẩm:</strong> ${humidity}%`;
            windElement.innerHTML = `<strong>Tốc độ gió:</strong> ${wind_speed} m/s`;

        }catch(err){
            console.error(err)
            alert("Loi tim kiem dia diem");
        }

        try{
            const POI = await axios.get("getPOI/",{
                params:{
                    "LAT": lat,
                    "LON": lon
                }
            })

            const topFivePOI = POI.data.slice(0, 5);
            console.log(topFivePOI);

            topFivePOI.forEach(p => {
                const nameLocation = p.tags.name || "Khong co ten";

                if (p.lat && p.lon)
                    L.marker([p.lat, p.lon]).addTo(map).bindPopup(nameLocation).openPopup();
            });

        }catch(err){
            console.error(err)
            alert("Loi tim kiem POI");
        }

        
    })
})