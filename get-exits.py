import docker
import re

def get_container_ips():
    client = docker.from_env()
    containers = client.containers.list(filters={"ancestor": "multisocks-private-tor"})
    
    ips = []
    for container in containers:
        exec_log = container.exec_run(
            "curl -s --socks5-hostname localhost:9050 https://cloudflare.com/cdn-cgi/trace",
            user="root"
        )
        result = exec_log.output.decode('utf-8')
        ip_match = re.search(r'ip=([^\n]+)', result)
        if ip_match:
            ips.append((container.id[:12], ip_match.group(1)))
    
    return ips

if __name__ == "__main__":
    container_ips = get_container_ips()
    if container_ips:
        for container_id, ip in container_ips:
            print(f"Container ID: {container_id}, IP: {ip}")
    else:
        print("No IPs found.")