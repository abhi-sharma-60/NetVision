from scapy.all import sniff, IP, TCP, UDP, ICMP, DNS
import time

def parse_packet(packet):
    """
    Parses a captured packet and extracts key features:
    IPs, Ports, Protocols, and Packet Size.
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

def packet_callback(packet):
    """
    Callback function that processes each captured packet.
    """
    parsed_data = parse_packet(packet)
    if parsed_data:
        # Format the port output gracefully
        sport = f":{parsed_data['src_port']}" if parsed_data['src_port'] else ""
        dport = f":{parsed_data['dst_port']}" if parsed_data['dst_port'] else ""
        
        print(f"[{parsed_data['protocol']}] {parsed_data['src_ip']}{sport} --> {parsed_data['dst_ip']}{dport} | Size: {parsed_data['size']} bytes | {parsed_data['info']}")

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
    start_sniffing()
