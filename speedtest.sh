#!/bin/bash

URL="https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/"
COUNT=50
MULTISOCKS_PROXY="multisocks.dark:8080"
LOCAL_TOR_PROXY="localhost:9050"

function make_concurrent_requests() {
    local proxy_address=$1
    echo "making $COUNT concurrent requests to $URL via SOCKS5 proxy at $proxy_address"
    local start_time=$(date +%s.%N)
    for i in $(seq 1 $COUNT); do
        curl -s -x socks5h://$proxy_address --connect-timeout 10 --retry 5 $URL > /dev/null &
    done
    wait
    local end_time=$(date +%s.%N)
    local elapsed=$(echo "$end_time - $start_time" | bc)
    echo "time taken for $COUNT concurrent requests through proxy ($proxy_address): $elapsed seconds"
}

function check_latency() {
    local proxy_address=$1
    local time_taken=$(curl -o /dev/null -s -w '%{time_total}\n' -x socks5://$proxy_address $URL)
    echo "latency for a request through $proxy_address: $time_taken seconds"
}

check_latency $MULTISOCKS_PROXY
make_concurrent_requests $MULTISOCKS_PROXY

check_latency $LOCAL_TOR_PROXY
make_concurrent_requests $LOCAL_TOR_PROXY
