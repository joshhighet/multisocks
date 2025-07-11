from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from stem import CircStatus
from stem.control import Controller
import geoip2.database
import requests
from io import StringIO
import csv
import docker

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_tor_containers():
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

@app.get("/tor-hosts")
def list_tor_hosts():
    tor_hosts = get_tor_containers()
    return tor_hosts

@app.get("/haproxy-stats")
def get_haproxy_stats():
    try:
        response = requests.get("http://haproxy:1337/;csv")
        response.raise_for_status()
        csv_data = StringIO(response.text)
        reader = csv.DictReader(csv_data)
        stats = [row for row in reader if row['# pxname'] == 'tors']  # Filter to 'tors' backend
        return {"backends": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch HAProxy stats: {str(e)}")
    
@app.get("/dashboard-data")
def get_dashboard_data():
    tor_hosts = get_tor_containers()
    haproxy_stats = get_haproxy_stats()["backends"]
    correlated = []
    for host in tor_hosts:
        matching_stats = next((s for s in haproxy_stats if s['svname'] == f"tor{host['hostname'].split('-')[-1]}"), {})
        correlated.append({
            "host": host,
            "haproxy": {
                "status": matching_stats.get('status', 'UNKNOWN'),
                "current_sessions": matching_stats.get('scur', 0),
            }
        })
    return {"data": correlated}

@app.get("/tor-hosts/{host_id}/circuits")
def get_tor_host_circuits(host_id: str):
    try:
        reader = geoip2.database.Reader('GeoLite2-City.mmdb')
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="GeoLite2-City.mmdb not found. Download from https://dev.maxmind.com/geoip/geoip2/geolite2/ and place it in the app directory.")
    
    tor_hosts = get_tor_containers()
    tor_host = next((host for host in tor_hosts if host['id'] == host_id), None)
    
    if not tor_host:
        raise HTTPException(status_code=404, detail="Tor host not found")
    
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