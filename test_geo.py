import time
from backend.geo_lookup import geo_engine
print("Geo for 8.8.8.8:", geo_engine.get_geo("8.8.8.8"))
time.sleep(2)
print("Geo for 8.8.8.8 after wait:", geo_engine.get_geo("8.8.8.8"))
