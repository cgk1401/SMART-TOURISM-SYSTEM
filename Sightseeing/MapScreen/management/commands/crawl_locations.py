from django.core.management.base import BaseCommand
import overpy, json, os

class Command(BaseCommand):
    help = 'Crawl OSM amenities (HCMC-wide) and export as Django fixture'

    def handle(self, *args, **options):
        api = overpy.Overpass()
        
        query = r"""
        [out:json][timeout:60];
        area
          ["boundary"="administrative"]
          ["admin_level"="4"]
          ["name"~"Thành phố Hồ Chí Minh|Ho Chi Minh City", i]
          ->.hcm;

        (
          node["amenity"](area.hcm);
          way ["amenity"](area.hcm);
          relation["amenity"](area.hcm);
        );
        out center tags;
        """

        result = api.query(query)

        data = []

        def add_record(pk, name, lat, lon, amenity, tags):
            data.append({
                "model": "MapScreen.Location",
                "pk": pk,
                "fields": {
                    "name": name,
                    "latitude": float(lat),
                    "longtitude": float(lon),
                    "description": amenity or "",
                    "image_path": "",
                    "tags": tags
                }
            })

        # nodes
        for n in result.nodes:
            name = n.tags.get("name") or n.tags.get("name:en")
            if not name: 
                continue
            add_record(n.id ,name, n.lat, n.lon, n.tags.get("amenity"), [n.tags.get("amenity", "")])

        # ways (có center_* nhờ 'out center')
        for w in result.ways:
            name = w.tags.get("name") or w.tags.get("name:en")
            if not name or w.center_lat is None or w.center_lon is None:
                continue
            add_record(w.id, name, w.center_lat, w.center_lon, w.tags.get("amenity"), [w.tags.get("amenity", "")])

        # relations (cũng có center_*)
        for r in result.relations:
            name = r.tags.get("name") or r.tags.get("name:en")
            if not name or r.center_lat is None or r.center_lon is None:
                continue
            add_record(r.id, name, r.center_lat, r.center_lon, r.tags.get("amenity"), [r.tags.get("amenity")])

        # Ghi vào fixtures của app
        from django.conf import settings
        fixtures_dir = os.path.join(settings.BASE_DIR, "MapScreen", "fixtures")
        os.makedirs(fixtures_dir, exist_ok=True)
        out_path = os.path.join(fixtures_dir, "Data1.json")

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)