# 🌏 Smart Tourism System

Welcome to the **Smart Tourism System** project. This platform supports travel location suggestions, itinerary planning, and local culture exploration.

![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2.9-092E20?style=for-the-badge&logo=django&logoColor=white)
![Status](https://img.shields.io/badge/Status-Completed-brightgreen?style=for-the-badge)

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🔍 Search & Autocomplete** | Fast location search by keyword. |
| **📍 Tag-based Suggestions** | Automatic location recommendations based on user preferences. |
| **🧭 Smart Routing** | Integrates **OpenRouteService** for optimal route planning. |
| **🧳 Trip Management** | Allows users to create, edit, and rate personal itineraries. |
| **⭐ Rating System** | Real-time rating updates based on user feedback. |
| **🗺 Map UI** | Smooth map interface powered by **OpenStreetMap** + **Leaflet** + **MapTiler**. |

## 📋 Table of Contents
1. [Environment Setup](#1-environment-setup-🛠)
2. [Environment Variables (.env)](#2-environment-variables-configuration-🔐)
3. [Database Configuration](#3-database-configuration-🗄)
4. [Data Seeding](#4-data-seeding-🌱)
5. [Running the Application](#5-running-the-application-🚀)

---

## 1. Environment Setup 🛠

First, ensure you have **Python 3.14** installed. It is recommended to use a virtual environment.

```bash
# Install required dependencies
pip install -r requirements.txt
```

---

## 2. Environment Variables Configuration 🔐

This project uses 3rd-party APIs for maps and weather services. You need to configure them via a `.env` file:

1.  Create a `.env` file in the root directory (same level as the `Sightseeing` folder).
2.  Add the following content and insert your API Keys:

```ini
# API for routing (OpenRouteService)
# Get key: https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/get
API_KEY_MAP=your_openrouteservice_key_here

# API for weather data (OpenWeatherMap)
# Get key: https://home.openweathermap.org/api_keys
API_WEATHER_API=your_openweathermap_key_here

# API for Map Tiles (MapTiler)
# Get key: https://www.maptiler.com/
MAPTILER_KEY=your_maptiler_key_here
```

---

## 3. Database Configuration 🗄

Initialize the database and apply Django migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 4. Data Seeding 🌱

To fully utilize the application features, you must seed data for **Locations** and **Default Routes**.

### 📍 Step 4.1: Seed Locations (MapScreen)

1.  Navigate to the `MapScreen` directory and create a `fixtures` folder.
2.  Create a file named `data6.json` (Path: `MapScreen/fixtures/data6.json`).
3.  Copy the JSON structure below into the file:

```json
[
    {
        "model": "MapScreen.Location",
        "pk": 2552505,
        "fields": {
            "name": "Chợ Bình Tây",
            "latitude": 10.7493311,
            "longtitude": 106.6510683,
            "tags": {
                "amenity": "marketplace",
                "interest": ["sightseeing"],
                "budget": "budget",
                "activity_level": "relaxed",
                "group_type": "all"
            },
            "description": "",
            "image_path": "",
            "website": "https://www.chobinhtay.gov.vn/",
            "rating": 7.63
        }
    }
    // ... Add more locations here
]
```

4.  **Run the command to load data:**
```bash
python manage.py loaddata data6.json
```

### 🗺️ Step 4.2: Seed Routes (RouteScreen)

1.  Navigate to the `RouteScreen` directory and create a `fixtures` folder.
2.  Create a file named `default_trips.json` (Path: `RouteScreen/fixtures/default_trips.json`).
3.  Copy the JSON structure below into the file:

```json
[
    {
       "title": "Sài Gòn Cổ Điển",
        "description": "Khám phá trung tâm Sài Gòn trong một ngày",
        "avg_rating": 4.5,
        "rating_count": 1,
        "stops":
        [
            {
                "pk": 801950766,
                "name": "Nhà thờ Đức Bà Sài Gòn",
                "address": "01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM",
                "lat": 10.779771,
                "lon": 106.6990579,
                "order": 1,
                "stay": 30
            },
            {
                "pk": 39598493,
                "name": "Dinh Độc Lập",
                "address": "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP.HCM",
                "lat": 10.777017,
                "lon": 106.6954031,
                "order": 2,
                "stay": 30       
            },
            {
                "pk": 39514795,
                "name": "Chợ Bến Thành",
                "address": "Lê Lợi, Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh, Việt Nam",
                "lat": 10.7725707,
                "lon": 106.6980174,
                "order": 3,
                "stay": 30
            },
            {
                "pk": 39514793,
                "name": "Bưu điện Trung tâm Sài Gòn",
                "address": "2 Công xã Paris, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam",
                "lat": 10.7799812,
                "lon": 106.7000211,
                "order": 4,
                "stay": 30
            }
        ]
    }
    // ... Add more routes here
]
```

4.  **Run the custom seed command:**
```bash
python manage.py seed_trips
```

---

## 5. Running the Application 🚀

**Step 1: Start the Server**
```bash
python manage.py runserver
```

**Step 2: Access the Application**
*   Home: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
*   Admin Dashboard: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
