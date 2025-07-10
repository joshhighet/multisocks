for container in $(docker ps --filter "ancestor=multisocks-private-tor" --format "{{.ID}}"); do
  docker exec -u root $container \
  curl -s --socks5-hostname localhost:9050 \
  https://cloudflare.com/cdn-cgi/trace \
  | grep ip | sed 's/ip=//'
done