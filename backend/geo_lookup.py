import requests
import threading

class GeoLookupEngine:
    def __init__(self):
        self.cache = {}
        self.internal_prefixes = ('192.168.', '10.', '127.')
        
    def _is_internal(self, ip):
        if not ip: return True
        if ip.startswith(self.internal_prefixes): return True
        parts = ip.split('.')
        try:
            if len(parts) == 4 and parts[0] == '172' and 16 <= int(parts[1]) <= 31:
                return True
        except:
            pass
        return False

    def get_geo(self, ip):
        """Fetches geo data synchronously so packets are never missing geo-tags."""
        if not ip or self._is_internal(ip):
            return None
            
        if ip in self.cache:
            return self.cache[ip]
            
        # Not in cache, fetch synchronously
        try:
            # ip-api.com allows 45 req/min free
            resp = requests.get(f"http://ip-api.com/json/{ip}", timeout=2).json()
            if resp.get("status") == "success":
                self.cache[ip] = {
                    "country": resp.get("country"),
                    "city": resp.get("city"),
                    "lat": resp.get("lat"),
                    "lon": resp.get("lon")
                }
            else:
                self.cache[ip] = None
        except Exception:
            self.cache[ip] = None

        return self.cache[ip]

geo_engine = GeoLookupEngine()
