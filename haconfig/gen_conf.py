import os
import docker
from jinja2 import Template


def get_tor_ips():
    client = docker.DockerClient(base_url='unix://tmp/docker.sock')
    network = client.networks.get("net_tor")
    net_tor_id = network.attrs["Id"]
    containers = client.containers.list()
    containers = [
        container for container in containers
        if ("net_tor" in container.attrs["NetworkSettings"]["Networks"])
        and (container.attrs["NetworkSettings"]["Networks"]["net_tor"]["NetworkID"] == net_tor_id)
        and (container.attrs["Config"]["User"] == "tor")
    ]
    ip_addrs = [container.attrs['NetworkSettings']['Networks']["net_tor"]["IPAddress"]
                for container in containers]
    return ip_addrs

if __name__ == "__main__":
    tor_ips = get_tor_ips()
    with open("haproxy.j2", "r") as file:
        conf = Template(file.read()).render(proxy_type='tcp', tor_port=9050, tor_hosts=tor_ips)
    with open("/usr/local/etc/haproxy/haproxy.cfg", "w") as file:
        file.write(conf)

