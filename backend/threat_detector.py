import time
from collections import defaultdict

class ThreatDetector:
    def __init__(self):
        # Maps src_ip -> list of (timestamp, dst_port)
        self.port_scan_history = defaultdict(list)
        self.port_scan_threshold = 20
        self.port_scan_window = 5.0 # seconds

        # Maps (src_ip, dst_ip, dst_port) -> list of timestamps
        self.brute_force_history = defaultdict(list)
        self.brute_force_threshold = 50
        self.brute_force_window = 10.0 # seconds

    def process_packet(self, packet):
        alerts = []
        src_ip = packet.get("src_ip")
        dst_ip = packet.get("dst_ip")
        dst_port = packet.get("dst_port")
        timestamp = packet.get("timestamp", time.time())

        if not src_ip or not dst_ip or not dst_port:
            return alerts

        # ---------------------------
        # 1. Port Scan Detection
        # ---------------------------
        self.port_scan_history[src_ip].append((timestamp, dst_port))
        
        recent_scan_conns = [
            conn for conn in self.port_scan_history[src_ip]
            if timestamp - conn[0] <= self.port_scan_window
        ]
        self.port_scan_history[src_ip] = recent_scan_conns
        
        distinct_ports = set(conn[1] for conn in recent_scan_conns)
        if len(distinct_ports) >= self.port_scan_threshold:
            alerts.append({
                "type": "Port Scan",
                "severity": "Medium",
                "src_ip": src_ip,
                "timestamp": timestamp,
                "message": f"Detected {len(distinct_ports)} distinct ports scanned in {self.port_scan_window}s"
            })
            self.port_scan_history[src_ip] = []

        # ---------------------------
        # 2. Brute Force Detection
        # ---------------------------
        target_key = (src_ip, dst_ip, dst_port)
        self.brute_force_history[target_key].append(timestamp)

        recent_bf_conns = [
            ts for ts in self.brute_force_history[target_key]
            if timestamp - ts <= self.brute_force_window
        ]
        self.brute_force_history[target_key] = recent_bf_conns

        if len(recent_bf_conns) >= self.brute_force_threshold:
            alerts.append({
                "type": "Brute Force",
                "severity": "High",
                "src_ip": src_ip,
                "timestamp": timestamp,
                "message": f"Detected {len(recent_bf_conns)} rapid connections to {dst_ip}:{dst_port} in {self.brute_force_window}s"
            })
            self.brute_force_history[target_key] = []

        return alerts

threat_detector = ThreatDetector()
