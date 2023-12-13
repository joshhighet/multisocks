import os
import docker
import platform
from jinja2 import Template

def get_dockernet_hostnames():
    if platform.system() == "Darwin":
        client = docker.DockerClient(base_url='unix://var/run/docker.sock')
    else:
        client = docker.DockerClient(base_url='unix://tmp/docker.sock')
    network = client.networks.get("net_tor")
    net_tor_id = network.attrs["Id"]
    containers = client.containers.list()
    container_names = [
        container.attrs['Name'][1:]
        for container in containers
        if ("net_tor" in container.attrs["NetworkSettings"]["Networks"])
        and (container.attrs["NetworkSettings"]["Networks"]["net_tor"]["NetworkID"] == net_tor_id)
        and (container.attrs["Config"]["User"] == "tor")
    ]
    sorted_container_names = sorted(container_names, key=lambda x: int(x.split('-')[-1]))
    return sorted_container_names

if __name__ == "__main__":
    cihosts = get_dockernet_hostnames()
    with open("haproxy.j2", "r") as file:
        conf = Template(file.read()).render(tor_hosts=cihosts)
    if platform.system() == "Darwin":
        outfile = "haproxy-valid.cfg"
    else:
        outfile = '/usr/local/etc/haproxy/haproxy.cfg'
    with open(outfile, "w") as file:
        file.write(conf)
