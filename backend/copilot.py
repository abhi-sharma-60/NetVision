import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq
API_KEY = os.getenv("GROQ_API_KEY")
if API_KEY:
    client = Groq(api_key=API_KEY)
else:
    client = None

class SecurityCopilot:
    def __init__(self):
        self.client = client

    def ask(self, query: str, network_context: dict) -> str:
        """
        Queries the Groq LLM (Llama 3) with the provided network context to answer the user's question.
        """
        if not self.client:
            return "Error: Groq API Key is missing. Please configure GROQ_API_KEY in backend/.env."

        # Format context into a readable string for the LLM
        # Truncate context string to prevent exceeding Llama 3's 8192 token limit
        context_str = json.dumps(network_context, indent=2)[:6000]
        
        system_prompt = f"""You are NetVision AI, a cybersecurity network copilot.
You have access to the following live metrics:
- Total Packets: {network_context.get('traffic_analytics', {}).get('total_packets', 0)}
- Total Bandwidth: {network_context.get('traffic_analytics', {}).get('total_bytes', 0)} bytes
- Packet Rate: {network_context.get('traffic_analytics', {}).get('packets_per_second', 0)} pkts/sec
- Active Devices: {len(network_context.get('traffic_analytics', {}).get('top_talkers', []))}
- Active Threats: {len(network_context.get('recent_alerts', []))} in the recent queue.

Top Talker IPs:
{json.dumps(network_context.get('traffic_analytics', {}).get('top_talkers', [])[:10], indent=2)}

Recent Alerts:
{json.dumps(network_context.get('recent_alerts', [])[:10], indent=2)}

Answer the user's query clearly and concisely based on this data. If there are no threats, explicitly state that the network is currently secure.
Always end your message by proactively asking if the user needs help with anything else or wants to type a custom request.

--- LIVE NETWORK CONTEXT ---
{context_str}
----------------------------
"""
        
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=500,
            )
                
            return response.choices[0].message.content
        except Exception as e:
            return f"Error connecting to AI Copilot: {str(e)}"

copilot_engine = SecurityCopilot()
