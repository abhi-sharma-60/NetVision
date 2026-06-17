import time

class TrafficAnalytics:
    def __init__(self):
        self.total_packets = 0
        self.total_bytes = 0
        self.start_time = time.time()
        self.protocols = {
            "TCP": 0,
            "UDP": 0,
            "DNS": 0,
            "ICMP": 0,
            "HTTP": 0,
            "HTTPS": 0,
            "Other": 0
        }

    def process_packet(self, packet_data):
        """Updates running totals with new packet data."""
        self.total_packets += 1
        self.total_bytes += packet_data.get("size", 0)
        
        protocol = packet_data.get("protocol", "Other")
        if protocol in self.protocols:
            self.protocols[protocol] += 1
        else:
            self.protocols["Other"] += 1

    def get_overview(self):
        """Calculates and returns the aggregated metrics."""
        elapsed_time = time.time() - self.start_time
        pps = int(self.total_packets / elapsed_time) if elapsed_time > 0 else 0
        
        # Filter out protocols with 0 count for cleaner output
        active_protocols = {k: v for k, v in self.protocols.items() if v > 0}
        
        return {
            "total_packets": self.total_packets,
            "total_bytes": self.total_bytes,
            "packets_per_second": pps,
            "protocols": active_protocols if active_protocols else self.protocols
        }

    def export_summary(self, filepath):
        import json, os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        try:
            with open(filepath, "w") as f:
                json.dump(self.get_overview(), f)
        except Exception:
            pass

    def load_summary(self, filepath):
        import json
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except Exception:
            return {
                "total_packets": 0,
                "total_bytes": 0,
                "packets_per_second": 0,
                "protocols": {}
            }

# Global singleton instance
analytics_engine = TrafficAnalytics()
