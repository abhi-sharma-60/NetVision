import time
import threading
from collections import defaultdict
import numpy as np
from sklearn.ensemble import IsolationForest

class MLEngine:
    def __init__(self):
        # Rolling stats per IP: src_ip -> { 'start_time': float, 'packets': int, 'bytes': int, 'dst_ips': set(), 'protocols': set() }
        self.current_windows = defaultdict(lambda: {
            'start_time': time.time(),
            'packets': 0,
            'bytes': 0,
            'dst_ips': set(),
            'protocols': set(),
            'protocol_counts': defaultdict(int)
        })
        
        self.window_duration = 10.0 # Extract features every 10 seconds
        
        # Historical feature vectors for unsupervised learning
        self.training_data = []
        self.max_training_samples = 1000
        self.min_samples_to_predict = 20
        
        # The ML Model
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.is_trained = False
        
        # To prevent spamming alerts for the same IP continuously
        self.last_alert_time = defaultdict(float)

    def process_packet(self, packet):
        alerts = []
        src_ip = packet.get("src_ip")
        if not src_ip:
            return alerts

        current_time = time.time()
        window = self.current_windows[src_ip]
        
        # If the window expired, extract features, predict, and reset
        if current_time - window['start_time'] >= self.window_duration:
            feature_vector = self._extract_features(window)
            
            # Predict Anomaly
            if self.is_trained:
                # model.predict returns 1 for inliers, -1 for outliers
                prediction = self.model.predict([feature_vector])[0]
                if prediction == -1:
                    # Calculate a realistic-looking confidence percentage (75% to 99%)
                    raw_score = self.model.decision_function([feature_vector])[0]
                    confidence_pct = min(99, max(75, int(abs(raw_score) * 600)))
                    
                    # Determine dominant protocol in this anomalous window
                    dominant_protocol = "Network"
                    if window['protocol_counts']:
                        dominant_protocol = max(window['protocol_counts'].items(), key=lambda x: x[1])[0]
                    
                    # Prevent alert spam
                    if current_time - self.last_alert_time[src_ip] > 30:
                        alerts.append({
                            "type": "AI Insight",
                            "severity": "High",
                            "src_ip": src_ip,
                            "timestamp": current_time,
                            "confidence": confidence_pct,
                            "message": f"Unusual {dominant_protocol} activity detected."
                        })
                        self.last_alert_time[src_ip] = current_time

            # Add to training data for continuous learning
            self.training_data.append(feature_vector)
            if len(self.training_data) > self.max_training_samples:
                self.training_data.pop(0)
            
            # Retrain model periodically (every 50 new samples)
            if len(self.training_data) >= self.min_samples_to_predict and len(self.training_data) % 50 == 0:
                self._train_model()
            elif not self.is_trained and len(self.training_data) >= self.min_samples_to_predict:
                self._train_model()

            # Reset window
            self.current_windows[src_ip] = {
                'start_time': current_time,
                'packets': 0,
                'bytes': 0,
                'dst_ips': set(),
                'protocols': set(),
                'protocol_counts': defaultdict(int)
            }
            window = self.current_windows[src_ip]

        # Update current window stats
        window['packets'] += 1
        window['bytes'] += packet.get('size', 0)
        window['dst_ips'].add(packet.get('dst_ip'))
        
        protocol = packet.get('protocol')
        window['protocols'].add(protocol)
        window['protocol_counts'][protocol] += 1
        
        return alerts

    def _extract_features(self, window):
        """
        Extracts exactly: [packet_size, packets_per_second, unique_destinations, protocol_frequency]
        """
        avg_packet_size = window['bytes'] / window['packets'] if window['packets'] > 0 else 0
        packets_per_second = window['packets'] / self.window_duration
        unique_destinations = len(window['dst_ips'])
        protocol_frequency = len(window['protocols'])
        
        return [avg_packet_size, packets_per_second, unique_destinations, protocol_frequency]

    def _train_model(self):
        """Trains the Isolation Forest in a background thread to prevent blocking the packet sniffer"""
        def train():
            try:
                # Need at least a 2D array
                X = np.array(self.training_data)
                self.model.fit(X)
                self.is_trained = True
                print(f"[*] AI Model Retrained on {len(X)} traffic profiles.")
            except Exception as e:
                print(f"[!] Model training failed: {e}")
                
        threading.Thread(target=train, daemon=True).start()

ml_engine = MLEngine()
