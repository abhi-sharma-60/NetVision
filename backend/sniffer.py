from scapy.all import sniff, IP, TCP, UDP, ICMP, DNS, ARP, Ether, srp
import time
import threading
import socket
import os
import json
import requests
from mac_vendor_lookup import MacLookup

mac_lookup = MacLookup()
device_fingerprints = {}
active_local_ips = set()
active_mac_map = {}

# Get local IP and subnet
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    GLOBAL_LOCAL_IP = s.getsockname()[0]
    s.close()
    GLOBAL_SUBNET_PREFIX = '.'.join(GLOBAL_LOCAL_IP.split('.')[:3]) + '.'
except:
    GLOBAL_LOCAL_IP = "127.0.0.1"
    GLOBAL_SUBNET_PREFIX = "127.0.0."

def parse_packet(packet):
    """
    Parses a captured packet and extracts key features:
    IPs, Ports, Protocols, Packet Size, and DPI Fingerprints.
    """
    if not packet.haslayer(IP):
        return None
        
    packet_info = {
        "timestamp": time.time(),
        "src_ip": packet[IP].src,
        "dst_ip": packet[IP].dst,
        "protocol": "Other",
        "src_port": None,
        "dst_port": None,
        "size": len(packet),
        "info": ""
    }

    # Protocol Analysis
    if packet.haslayer(TCP):
        packet_info["protocol"] = "TCP"
        packet_info["src_port"] = packet[TCP].sport
        packet_info["dst_port"] = packet[TCP].dport
        
        # HTTP/HTTPS Detection based on common ports
        if packet_info["src_port"] == 80 or packet_info["dst_port"] == 80:
            packet_info["protocol"] = "HTTP"
            
            # Deep Packet Inspection (DPI) for OS Fingerprinting
            if packet.haslayer("Raw"):
                payload = packet["Raw"].load.decode('utf-8', errors='ignore')
                if "User-Agent:" in payload:
                    for line in payload.split('\r\n'):
                        if line.startswith("User-Agent:"):
                            ua = line
                            ip_src = packet[IP].src
                            if "iPhone" in ua:
                                device_fingerprints[ip_src] = "iPhone"
                            elif "iPad" in ua:
                                device_fingerprints[ip_src] = "iPad"
                            elif "Macintosh" in ua or "Mac OS" in ua:
                                device_fingerprints[ip_src] = "MacBook"
                            elif "Android" in ua:
                                device_fingerprints[ip_src] = "Android Device"
                            elif "Windows" in ua:
                                device_fingerprints[ip_src] = "Windows PC"
                            elif "Linux" in ua:
                                device_fingerprints[ip_src] = "Linux Host"

        elif packet_info["src_port"] == 443 or packet_info["dst_port"] == 443:
            packet_info["protocol"] = "HTTPS"

    elif packet.haslayer(UDP):
        packet_info["protocol"] = "UDP"
        packet_info["src_port"] = packet[UDP].sport
        packet_info["dst_port"] = packet[UDP].dport
        
        # DNS specific extraction
        if packet.haslayer(DNS):
            packet_info["protocol"] = "DNS"
            try:
                if packet.getlayer(DNS).qd:
                    packet_info["info"] = packet.getlayer(DNS).qd.qname.decode('utf-8', errors='ignore')
            except Exception:
                pass

    elif packet.haslayer(ICMP):
        packet_info["protocol"] = "ICMP"
        packet_info["info"] = f"Type: {packet[ICMP].type} Code: {packet[ICMP].code}"

    return packet_info

from analytics import analytics_engine
from threat_detector import threat_detector
from ml_engine import ml_engine
from geo_lookup import geo_engine

# Robust absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "logs", "packets.json")
SUMMARY_FILE = os.path.join(BASE_DIR, "logs", "analytics_summary.json")

# Global in-memory store for packets
packet_store = []

# Ensure log directory exists
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def store_packet(parsed_data):
    """
    Stores the extracted metadata, updates analytics, and pushes to API.
    """
    metadata = {
        "timestamp": parsed_data["timestamp"],
        "src_ip": parsed_data["src_ip"],
        "dst_ip": parsed_data["dst_ip"],
        "src_port": parsed_data["src_port"],
        "dst_port": parsed_data["dst_port"],
        "protocol": parsed_data["protocol"],
        "size": parsed_data["size"],
        "info": parsed_data["info"],
        "src_geo": geo_engine.get_geo(parsed_data["src_ip"]),
        "dst_geo": geo_engine.get_geo(parsed_data["dst_ip"])
    }
    
    # Passive Device Discovery (Bypasses AP Isolation)
    if parsed_data["src_ip"].startswith(GLOBAL_SUBNET_PREFIX):
        active_local_ips.add(parsed_data["src_ip"])
    if parsed_data["dst_ip"].startswith(GLOBAL_SUBNET_PREFIX):
        active_local_ips.add(parsed_data["dst_ip"])
        
    packet_store.append(metadata)
    analytics_engine.process_packet(metadata)
    
    # Export running totals for the FastAPI server to read instantly
    analytics_engine.export_summary(SUMMARY_FILE)

    # Process packet for static threat rules
    alerts = threat_detector.process_packet(metadata)
    for alert in alerts:
        try:
            requests.post("http://localhost:8000/api/alert", json=alert, timeout=0.1)
        except:
            pass
            
    # Process packet for AI anomalies
    ml_alerts = ml_engine.process_packet(metadata)
    for alert in ml_alerts:
        try:
            requests.post("http://localhost:8000/api/alert", json=alert, timeout=0.1)
        except:
            pass

    # Push to API for real-time Socket.IO broadcast
    try:
        requests.post("http://localhost:8000/api/ingest", json=metadata, timeout=0.1)
    except:
        pass
    
    # Append to log file (this will serve as our dataset for ML later)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(metadata) + "\n")
    except Exception as e:
        print(f"Failed to write to log: {e}")

def packet_callback(packet):
    """
    Callback function that processes each captured packet.
    """
    parsed_data = parse_packet(packet)
    if parsed_data:
        # Format the port output gracefully
        sport = f":{parsed_data['src_port']}" if parsed_data['src_port'] else ""
        dport = f":{parsed_data['dst_port']}" if parsed_data['dst_port'] else ""
        
        print(f"[{parsed_data['protocol']}] {parsed_data['src_ip']}{sport} --> {parsed_data['dst_ip']}{dport} | Size: {parsed_data['size']} bytes")
        
        # Store the extracted metadata
        store_packet(parsed_data)

def active_arp_scanner():
    """
    Runs continuously in a background thread, performing scapy.ARP sweeps
    to dynamically discover network devices and merge with DPI fingerprints.
    """
    trigger_file = "/tmp/netvision_force_scan.trigger"
    last_trigger_time = 0
    last_scan_time = 0

    while True:
        try:
            current_trigger = os.path.getmtime(trigger_file) if os.path.exists(trigger_file) else 0
            
            # Run scan if 10 seconds passed, OR if forced by UI button
            if time.time() - last_scan_time > 10 or current_trigger > last_trigger_time:
                last_trigger_time = current_trigger
                last_scan_time = time.time()
                
                subnet = GLOBAL_SUBNET_PREFIX + '0/24'
                
                arp = ARP(pdst=subnet)
                ether = Ether(dst="ff:ff:ff:ff:ff:ff")
                packet = ether/arp
                
                # Perform active scan
                result = srp(packet, timeout=1.5, verbose=0)[0]
                
                # Build unified device map
                scanned_map = {}
                
                # Add local machine automatically
                scanned_map[GLOBAL_LOCAL_IP] = "Local Host (NetVision System)"
                active_mac_map[GLOBAL_LOCAL_IP] = "System Hardware"

                # Process active ARP results
                for sent, received in result:
                    mac = received.hwsrc.upper()
                    ip = received.psrc
                    scanned_map[ip] = mac
                    active_mac_map[ip] = mac
                    active_local_ips.add(ip)

                devices = []
                for ip in active_local_ips:
                    mac = active_mac_map.get(ip, "Unknown MAC")
                    
                    # 2. Vendor Resolution
                    vendor = "Unknown Vendor"
                    if mac != "Unknown MAC" and mac != "System Hardware":
                        try:
                            normalized_mac = ':'.join([p.zfill(2) for p in mac.split(':')])
                            vendor = mac_lookup.lookup(normalized_mac)
                        except:
                            first_octet = int(mac.split(':')[0], 16)
                            if (first_octet & 2) == 2:
                                vendor = "Private MAC (Apple/Android)"
                            else:
                                vendor = "Unknown Vendor"
                    elif mac == "System Hardware":
                        vendor = "Local System"
                        
                    # 1. Hostname Resolution via DPI
                    name = device_fingerprints.get(ip, "?")
                    if name == "?":
                        try:
                            name = socket.gethostbyaddr(ip)[0]
                        except:
                            # Purely dynamic fallback without hardcoding
                            if vendor and "Unknown" not in vendor and "Private" not in vendor and vendor != "Local System":
                                name = f"{vendor.split(',')[0].split(' ')[0]} Device"
                            elif ip == GLOBAL_LOCAL_IP:
                                name = f"Host System ({ip})"
                            else:
                                name = f"Device ({ip})"
                            
                    devices.append({
                        "name": name,
                        "ip": ip,
                        "mac": mac,
                        "vendor": vendor
                    })
                    
                # Dump to JSON for main.py to serve
                scanned_file = os.path.join(BASE_DIR, "logs", "scanned_devices.json")
                with open(scanned_file, "w") as f:
                    json.dump(devices, f)
                    
        except Exception as e:
            pass
            
        time.sleep(1)

def attack_simulator():
    trigger_file = "/tmp/netvision_simulate.trigger"
    while True:
        try:
            if os.path.exists(trigger_file):
                with open(trigger_file, "r") as f:
                    attack = f.read().strip()
                os.remove(trigger_file)
                
                print(f"[*] Starting attack simulation: {attack}")
                
                if attack == "DNS Flood":
                    for i in range(50):
                        store_packet({
                            "timestamp": time.time(),
                            "src_ip": "10.0.0.99",
                            "dst_ip": GLOBAL_LOCAL_IP,
                            "protocol": "DNS",
                            "src_port": 50000 + i,
                            "dst_port": 53,
                            "size": 120,
                            "info": "malicious-domain.com"
                        })
                        time.sleep(0.01)
                        
                elif attack == "Port Scan":
                    for i in range(1, 30):
                        store_packet({
                            "timestamp": time.time(),
                            "src_ip": "192.168.1.100",
                            "dst_ip": GLOBAL_LOCAL_IP,
                            "protocol": "TCP",
                            "src_port": 45000,
                            "dst_port": i,
                            "size": 60,
                            "info": "SYN"
                        })
                        time.sleep(0.01)
                        
                elif attack == "ICMP Flood":
                    for i in range(60):
                        store_packet({
                            "timestamp": time.time(),
                            "src_ip": "203.0.113.5",
                            "dst_ip": GLOBAL_LOCAL_IP,
                            "protocol": "ICMP",
                            "src_port": None,
                            "dst_port": None,
                            "size": 1500,
                            "info": "Type: 8 Code: 0"
                        })
                        time.sleep(0.01)
        except Exception as e:
            print(f"[!] Simulation error: {e}")
        time.sleep(1)

def start_sniffing(interface=None):
    """
    Starts the packet sniffer.
    """
    print(f"[*] Starting advanced protocol sniffer... (Interface: {interface or 'Default'})")
    try:
        sniff(iface=interface, prn=packet_callback, store=False)
    except PermissionError:
        print("[!] Permission Denied: Packet sniffing usually requires administrator/root privileges.")
        print("[!] Try running the script with 'sudo'.")
    except Exception as e:
        print(f"[!] An error occurred while sniffing: {e}")

if __name__ == "__main__":
    # Start the Scapy ARP background scanner
    threading.Thread(target=active_arp_scanner, daemon=True).start()
    threading.Thread(target=attack_simulator, daemon=True).start()
    start_sniffing()
