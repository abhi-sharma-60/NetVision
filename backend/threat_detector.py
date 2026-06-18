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

        # DNS Flood (src_ip -> timestamps)
        self.dns_history = defaultdict(list)
        self.dns_threshold = 40
        self.dns_window = 5.0

        # ICMP Flood (src_ip -> timestamps)
        self.icmp_history = defaultdict(list)
        self.icmp_threshold = 50
        self.icmp_window = 5.0

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

        # ---------------------------
        # 3. DNS Flood Detection
        # ---------------------------
        if packet.get("protocol") == "DNS" or dst_port == 53:
            self.dns_history[src_ip].append(timestamp)
            recent_dns = [ts for ts in self.dns_history[src_ip] if timestamp - ts <= self.dns_window]
            self.dns_history[src_ip] = recent_dns
            
            if len(recent_dns) >= self.dns_threshold:
                alerts.append({
                    "type": "DNS Flood",
                    "severity": "High",
                    "src_ip": src_ip,
                    "timestamp": timestamp,
                    "message": f"Detected {len(recent_dns)} DNS queries in {self.dns_window}s"
                })
                self.dns_history[src_ip] = []

        # ---------------------------
        # 4. ICMP Flood Detection
        # ---------------------------
        if packet.get("protocol") == "ICMP":
            self.icmp_history[src_ip].append(timestamp)
            recent_icmp = [ts for ts in self.icmp_history[src_ip] if timestamp - ts <= self.icmp_window]
            self.icmp_history[src_ip] = recent_icmp
            
            if len(recent_icmp) >= self.icmp_threshold:
                alerts.append({
                    "type": "ICMP Ping Flood",
                    "severity": "High",
                    "src_ip": src_ip,
                    "timestamp": timestamp,
                    "message": f"Detected {len(recent_icmp)} ICMP packets in {self.icmp_window}s"
                })
                self.icmp_history[src_ip] = []

        return alerts

threat_detector = ThreatDetector()
