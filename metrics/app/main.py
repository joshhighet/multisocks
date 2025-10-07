from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from stem import CircStatus
from stem.control import Controller
import geoip2.database
import requests
import os
from io import StringIO
import csv
import docker
import asyncio
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
from functools import lru_cache
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logging.getLogger('stem').setLevel(logging.WARNING)

app = FastAPI(title="multisocks Metrics API", version="1.0.0")
app.add_middleware(GZipMiddleware, minimum_size=1000)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        containers = client.containers.list(filters={"network": "net_tor"})
        tor_hosts = []
        for container in containers:
            if container.attrs.get('Config', {}).get('User') == 'tor':
                tor_hosts.append({
                    "id": container.short_id,
                    "ip_address": container.attrs['NetworkSettings']['Networks']['net_tor']['IPAddress'],
                    "hostname": container.name,
                    "image": container.image.tags[0] if container.image.tags else container.image.short_id,
                    "state": container.status
                })
        return sorted(tor_hosts, key=lambda x: x['hostname'])
    except Exception as e:
        logger.error(f"error getting Tor containers: {e}")
        return []

def get_haproxy_stats():
    try:
        response = requests.get("http://haproxy:1337/;csv", timeout=5)
        response.raise_for_status()
        csv_data = StringIO(response.text)
        reader = csv.DictReader(csv_data)
        backends = []
        for row in reader:
            if row['# pxname'] == 'tors':
                backends.append({
                    "pxname": row['# pxname'],
                    "svname": row['svname'],
                    "status": row['status'],
                    "scur": int(row['scur']) if row['scur'].isdigit() else 0,
                    "smax": int(row['smax']) if row['smax'].isdigit() else 0,
                    "stot": int(row['stot']) if row['stot'].isdigit() else 0,
                    "bin": int(row['bin']) if row['bin'].isdigit() else 0,
                    "bout": int(row['bout']) if row['bout'].isdigit() else 0,
                    "ereq": int(row['ereq']) if row['ereq'].isdigit() else 0,
                    "econ": int(row['econ']) if row['econ'].isdigit() else 0,
                    "eresp": int(row['eresp']) if row['eresp'].isdigit() else 0,
                    "wretr": int(row['wretr']) if row['wretr'].isdigit() else 0,
                    "wredis": int(row['wredis']) if row['wredis'].isdigit() else 0,
                    "weight": int(row['weight']) if row['weight'].isdigit() else 0,
                    "act": int(row['act']) if row['act'].isdigit() else 0,
                    "bck": int(row['bck']) if row['bck'].isdigit() else 0,
                    "chkfail": int(row['chkfail']) if row['chkfail'].isdigit() else 0,
                    "chkdown": int(row['chkdown']) if row['chkdown'].isdigit() else 0,
                    "downtime": int(row['downtime']) if row['downtime'].isdigit() else 0,
                    "rate": int(row['rate']) if row['rate'].isdigit() else 0,
                    "rate_max": int(row['rate_max']) if row['rate_max'].isdigit() else 0,
                    "hrsp_2xx": int(row['hrsp_2xx']) if row['hrsp_2xx'].isdigit() else 0,
                    "hrsp_3xx": int(row['hrsp_3xx']) if row['hrsp_3xx'].isdigit() else 0,
                    "hrsp_4xx": int(row['hrsp_4xx']) if row['hrsp_4xx'].isdigit() else 0,
                    "hrsp_5xx": int(row['hrsp_5xx']) if row['hrsp_5xx'].isdigit() else 0,
                    "cli_abrt": int(row['cli_abrt']) if row['cli_abrt'].isdigit() else 0,
                    "srv_abrt": int(row['srv_abrt']) if row['srv_abrt'].isdigit() else 0,
                    "lastsess": int(row['lastsess']) if row['lastsess'].isdigit() else 0,
                    "qtime": int(row['qtime']) if row['qtime'].isdigit() else 0,
                    "ctime": int(row['ctime']) if row['ctime'].isdigit() else 0,
                    "rtime": int(row['rtime']) if row['rtime'].isdigit() else 0,
                    "ttime": int(row['ttime']) if row['ttime'].isdigit() else 0,
                    "check_status": row['check_status'],
                    "check_code": int(row['check_code']) if row['check_code'].isdigit() else 0,
                    "check_duration": int(row['check_duration']) if row['check_duration'].isdigit() else 0,
                    "last_chk": row['last_chk'],
                    "qtime_max": int(row['qtime_max']) if row['qtime_max'].isdigit() else 0,
                    "ctime_max": int(row['ctime_max']) if row['ctime_max'].isdigit() else 0,
                    "rtime_max": int(row['rtime_max']) if row['rtime_max'].isdigit() else 0,
                    "ttime_max": int(row['ttime_max']) if row['ttime_max'].isdigit() else 0
                })
        return {"backends": backends}
    except Exception as e:
        logger.error(f"error getting HAProxy stats: {e}")
        return {"backends": []}

external_ip_cache = {}
CACHE_DURATION = 300
@lru_cache(maxsize=128)
def get_geoip_location(address: str):
    try:
        reader = geoip2.database.Reader('GeoLite2-City.mmdb')
        response = reader.city(address)
        return {
            "city": response.city.name,
            "country": response.country.name,
            "latitude": float(response.location.latitude),
            "longitude": float(response.location.longitude)
        }
    except FileNotFoundError:
        logger.warning("GeoLite2-City.mmdb not found. download from https://dev.maxmind.com/geoip/geoip2/geolite2/")
        return {"city": "Unknown", "country": "Unknown", "latitude": 0, "longitude": 0}
    except Exception as e:
        logger.warning(f"GeoIP lookup failed: {e}")
        return {"city": "Unknown", "country": "Unknown", "latitude": 0, "longitude": 0}

dashboard_cache = {}
DASHBOARD_CACHE_DURATION = 2

def get_tor_external_ip(host_ip: str):
    import time
    cache_key = host_ip
    if cache_key in external_ip_cache:
        cached_data = external_ip_cache[cache_key]
        if time.time() - cached_data['timestamp'] < CACHE_DURATION:
            return cached_data['ip']
    try:
        import requests
        session = requests.Session()
        session.proxies = {
            'http': f'socks5://{host_ip}:9050',
            'https': f'socks5://{host_ip}:9050'
        }
        response = session.get('https://cloudflare.com/cdn-cgi/trace', timeout=5)
        if response.status_code == 200:
            for line in response.text.split('\n'):
                if line.startswith('ip='):
                    ip = line.split('=')[1]
                    external_ip_cache[cache_key] = {
                        'ip': ip,
                        'timestamp': time.time()
                    }
                    return ip
        return None
    except Exception as e:
        logger.warning(f"could not get external IP for {host_ip}: {e}")
        return None

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
    max_retries = 3
    retry_delay = 1
    for attempt in range(max_retries):
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
                if host_info["circuits"]:
                    for circuit in host_info["circuits"]:
                        if circuit["path"] and len(circuit["path"]) > 0:
                            exit_node = circuit["path"][-1]
                            host_info["external_ip"] = exit_node["address"]
                            break
                break
                        
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed for {host_id}: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                logger.error(f"All attempts failed for {host_id}: {e}")
                host_info["error"] = str(e)
    
    return host_info

def calculate_summary(tor_hosts: List[Dict], haproxy_stats: List[Dict]) -> Dict[str, Any]:
    total_circuits = sum(len(host.get('circuits', [])) for host in tor_hosts)
    active_circuits = sum(len([c for c in host.get('circuits', []) if c.get('purpose') != 'CLOSED']) for host in tor_hosts)
    total_sessions = sum(stat.get('stot', 0) for stat in haproxy_stats)
    total_bytes_in = sum(stat.get('bin', 0) for stat in haproxy_stats)
    total_bytes_out = sum(stat.get('bout', 0) for stat in haproxy_stats)
    average_latency = 999999  #TODO
    healthy_backends = len([stat for stat in haproxy_stats if stat.get('status') == 'UP'])
    total_backends = len(haproxy_stats)
    return {
        "totalCircuits": total_circuits,
        "activeCircuits": active_circuits,
        "totalSessions": total_sessions,
        "totalBytesIn": total_bytes_in,
        "totalBytesOut": total_bytes_out,
        "averageLatency": average_latency,
        "healthyBackends": healthy_backends,
        "totalBackends": total_backends,
        "uptime": 0 #TODO
    }

def rebuild_circuits_for_host(host_id: str):
    """Rebuild all circuits for a specific Tor host"""
    try:
        tor_hosts = get_tor_containers()
        tor_host = next((host for host in tor_hosts if host['id'] == host_id), None)
        if not tor_host:
            return {"error": "tor host not found"}
        
        with Controller.from_port(address=tor_host["ip_address"], port=9051) as controller:
            controller.authenticate(password="log4j2.enableJndiLookup")
            circuits = controller.get_circuits()
            for circ in circuits:
                if circ.status == CircStatus.BUILT:
                    try:
                        controller.close_circuit(circ.id)
                    except Exception as e:
                        logger.warning(f"could not close circuit {circ.id}: {e}")

            controller.signal("NEWNYM")            
            return {"success": True, "message": f"rebuilding circuits for {tor_host['hostname']}"}
            
    except Exception as e:
        logger.error(f"error rebuilding circuits for host {host_id}: {e}")
        return {"error": str(e)}

def close_circuit(host_id: str, circuit_id: str):
    """close a specific circuit"""
    try:
        tor_hosts = get_tor_containers()
        tor_host = next((host for host in tor_hosts if host['id'] == host_id), None)
        
        if not tor_host:
            return {"error": "Tor host not found"}
        
        with Controller.from_port(address=tor_host["ip_address"], port=9051) as controller:
            controller.authenticate(password="log4j2.enableJndiLookup")
            circuit = next((c for c in controller.get_circuits() if c.id == circuit_id), None)
            if not circuit:
                return {"error": "circuit not found"}
            controller.close_circuit(circuit_id)
            return {"success": True, "message": f"closed circuit {circuit_id}"}
            
    except Exception as e:
        logger.error(f"error closing circuit {circuit_id} on host {host_id}: {e}")
        return {"error": str(e)}

def rebuild_all_circuits():
    """rebuild circuits for all Tor hosts"""
    try:
        tor_hosts = get_tor_containers()
        results = []
        for host in tor_hosts:
            result = rebuild_circuits_for_host(host['id'])
            results.append({
                "host_id": host['id'],
                "hostname": host['hostname'],
                "result": result
            })
        
        return {"success": True, "results": results}
        
    except Exception as e:
        logger.error(f"Error rebuilding all circuits: {e}")
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "multisocks metrics", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

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
    cache_key = "dashboard_data"
    current_time = time.time()
    if cache_key in dashboard_cache:
        cached_data, timestamp = dashboard_cache[cache_key]
        if current_time - timestamp < DASHBOARD_CACHE_DURATION:
            return cached_data
    tor_hosts = get_tor_containers()
    haproxy_data = get_haproxy_stats()
    haproxy_stats = haproxy_data.get('backends', [])
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
                "external_ip": circuits_data.get('external_ip'),
                "circuits": circuits_data.get('circuits', [])
            })
    
    summary = calculate_summary(tor_hosts_with_circuits, haproxy_stats)
    
    result = {
        "torHosts": tor_hosts_with_circuits,
        "haproxyStats": haproxy_stats,
        "summary": summary,
        "lastUpdated": datetime.now().isoformat()
    }
    dashboard_cache[cache_key] = (result, current_time)
    return result

@app.post("/tor-hosts/{host_id}/rebuild-circuits")
def rebuild_host_circuits(host_id: str):
    """rebuild all circuits for a specific Tor host"""
    result = rebuild_circuits_for_host(host_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/circuits/{circuit_id}/close")
def close_circuit_endpoint(circuit_id: str, host_id: str):
    """close a specific circuit"""
    result = close_circuit(host_id, circuit_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/circuits/rebuild-all")
def rebuild_all_circuits_endpoint():
    """rebuild circuits for all Tor hosts"""
    result = rebuild_all_circuits()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/tor-hosts/{host_id}/new-identity")
def new_identity(host_id: str):
    """request new identity for a Tor host (triggers circuit rebuild)"""
    try:
        tor_hosts = get_tor_containers()
        tor_host = next((host for host in tor_hosts if host['id'] == host_id), None)
        if not tor_host:
            raise HTTPException(status_code=404, detail="Tor host not found")
        with Controller.from_port(address=tor_host["ip_address"], port=9051) as controller:
            controller.authenticate(password="log4j2.enableJndiLookup")
            controller.signal("NEWNYM")
            return {"success": True, "message": f"New identity requested for {tor_host['hostname']}"}
            
    except Exception as e:
        logger.error(f"Error requesting new identity for host {host_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            dashboard_data = get_dashboard_data()
            await manager.broadcast({
                "type": "dashboard_update",
                "data": dashboard_data,
                "timestamp": datetime.now().isoformat()
            })
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
