from django.http import HttpResponse
import requests
import folium

def map_screen(request):
    lat, lon = 10.762622, 106.660172

    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    response = requests.get(url, headers={"User-Agent": "OSM-Demo-App"})
    data = response.json()

    m = folium.Map(location=[lat, lon], zoom_start=16)
    folium.Marker([lat, lon], tooltip=data.get("display_name", "Unknown")).add_to(m)
    map_html = m._repr_html_()

    return HttpResponse(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Map Screen</title>
        </head>
        <body style="text-align:center;">
            <h1 style="margin-top:10px;">Map Screen</h1>

            <a href="/MainScreen/" style="
                display:inline-block;
                padding:10px 20px;
                background-color:#4CAF50;
                color:white;
                text-decoration:none;
                border-radius:5px;
                margin-bottom:10px;
            ">Back to Main Screen</a>

            <div style="width: 80%; margin: 20px auto;">
                {map_html}
            </div>
        </body>
        </html>
    """)
