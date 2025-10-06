from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from stem import CircStatus
from stem.control import Controller
import geoip2.database
import requests
from io import StringIO
import csv
import docker
import asyncio
import json
from typing import List, Dict, Any
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="multisocks Metrics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(data))
            except:
                pass

manager = ConnectionManager()

def get_tor_containers():
    try:
        client = docker.from_env()
        containers = client.containers.list(filters={"ancestor": "multisocks-tor"})
        tor_hosts = []
        for container in containers:
            container_info = {
                "id": container.id,
                "ip_address": container.attrs['NetworkSettings']['Networks']['net_tor']['IPAddress'],
                "hostname": container.name,
                "image": container.image.tags[0] if container.image.tags else "unknown",
                "state": container.attrs['State']['Status']
            }
            tor_hosts.append(container_info)
        return tor_hosts
    except Exception as e:
        logger.error(f"Error getting Tor containers: {e}")
        return []

def get_haproxy_stats():
    try:
        response = requests.get("http://haproxy:1337/;csv", timeout=5)
        response.raise_for_status()
        csv_data = StringIO(response.text)
        reader = csv.DictReader(csv_data)
        stats = [row for row in reader if row['# pxname'] == 'tors']
        return {"backends": stats}
    except Exception as e:
        logger.error(f"Error getting HAProxy stats: {e}")
        return {"backends": []}

def get_tor_host_circuits(host_id: str):
    try:
        reader = geoip2.database.Reader('GeoLite2-City.mmdb')
    except FileNotFoundError:
        logger.error("GeoLite2-City.mmdb not found")
        return {
            "error": "GeoLite2-City.mmdb not found. Download from https://dev.maxmind.com/geoip/geoip2/geolite2/ and place it in the app directory."
        }
    
    tor_hosts = get_tor_containers()
    tor_host = next((host for host in tor_hosts if host['id'] == host_id), None)
    
    if not tor_host:
        return {"error": "Tor host not found"}
    
    host_info = {
        "ip_address": tor_host["ip_address"],
        "hostname": tor_host["hostname"],
        "image": tor_host["image"],
        "state": tor_host["state"],
        "circuits": []
    }

    try:
        with Controller.from_port(address=tor_host["ip_address"], port=9051) as controller:
            controller.authenticate(password="log4j2.enableJndiLookup")
            for circ in sorted(controller.get_circuits()):
                if circ.status != CircStatus.BUILT:
                    continue
                circuit_info = {
                    "circuit_id": circ.id,
                    "purpose": circ.purpose,
                    "path": []
                }
                for i, entry in enumerate(circ.path):
                    fingerprint, nickname = entry
                    desc = controller.get_network_status(fingerprint, None)
                    address = desc.address if desc else 'unknown'
                    try:
                        response = reader.city(address)
                        location = {
                            "country": response.country.name,
                            "city": response.city.name,
                            "latitude": response.location.latitude,
                            "longitude": response.location.longitude
                        }
                    except Exception:
                        location = {
                            "country": "unknown",
                            "city": "unknown",
                            "latitude": None,
                            "longitude": None
                        }
                    
                    circuit_info["path"].append({
                        "fingerprint": fingerprint,
                        "nickname": nickname,
                        "address": address,
                        "location": location
                    })

                host_info["circuits"].append(circuit_info)
    except Exception as e:
        host_info["error"] = str(e)
    
    return host_info

def calculate_summary(tor_hosts: List[Dict], haproxy_stats: List[Dict]) -> Dict[str, Any]:
    total_circuits = sum(len(host.get('circuits', [])) for host in tor_hosts)
    active_circuits = sum(
        len([c for c in host.get('circuits', []) if c.get('purpose') != 'CLOSED'])
        for host in tor_hosts
    )
    
    backend_stats = [stat for stat in haproxy_stats if stat.get('svname') == 'BACKEND']
    total_sessions = sum(int(stat.get('stot', 0)) for stat in backend_stats)
    total_bytes_in = sum(int(stat.get('bin', 0)) for stat in backend_stats)
    total_bytes_out = sum(int(stat.get('bout', 0)) for stat in backend_stats)
    
    server_stats = [
        stat for stat in haproxy_stats 
        if stat.get('svname') not in ['FRONTEND', 'BACKEND'] and stat.get('status') == 'UP'
    ]
    avg_latency = 0
    if server_stats:
        total_latency = sum(float(stat.get('ttime', 0)) for stat in server_stats)
        avg_latency = total_latency / len(server_stats)
    
    healthy_backends = len(server_stats)
    total_backends = len([
        stat for stat in haproxy_stats 
        if stat.get('svname') not in ['FRONTEND', 'BACKEND']
    ])
    
    return {
        "totalCircuits": total_circuits,
        "activeCircuits": active_circuits,
        "totalSessions": total_sessions,
        "totalBytesIn": total_bytes_in,
        "totalBytesOut": total_bytes_out,
        "averageLatency": avg_latency,
        "healthyBackends": healthy_backends,
        "totalBackends": total_backends,
        "uptime": 0  # Would need container start times
    }

@app.get("/")
async def root():
    return {"message": "multisocks Metrics API", "version": "1.0.0"}

@app.get("/tor-hosts")
def list_tor_hosts():
    tor_hosts = get_tor_containers()
    return tor_hosts

@app.get("/haproxy-stats")
def get_haproxy_stats_endpoint():
    return get_haproxy_stats()

@app.get("/tor-hosts/{host_id}/circuits")
def get_tor_host_circuits_endpoint(host_id: str):
    return get_tor_host_circuits(host_id)

@app.get("/dashboard-data")
def get_dashboard_data():
    tor_hosts = get_tor_containers()
    haproxy_data = get_haproxy_stats()
    haproxy_stats = haproxy_data.get('backends', [])
    
    # Get circuits for each host
    tor_hosts_with_circuits = []
    for host in tor_hosts:
        circuits_data = get_tor_host_circuits(host['id'])
        if 'error' in circuits_data:
            tor_hosts_with_circuits.append({
                **host,
                "circuits": [],
                "error": circuits_data['error']
            })
        else:
            tor_hosts_with_circuits.append({
                **host,
                "circuits": circuits_data.get('circuits', [])
            })
    
    summary = calculate_summary(tor_hosts_with_circuits, haproxy_stats)
    
    return {
        "torHosts": tor_hosts_with_circuits,
        "haproxyStats": haproxy_stats,
        "summary": summary,
        "lastUpdated": datetime.now().isoformat()
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send dashboard data every 5 seconds
            data = get_dashboard_data()
            await manager.broadcast(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)