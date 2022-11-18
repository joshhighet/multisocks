#!/bin/bash

# Using tput to write bold text and colors
bold=$(tput bold)
normal=$(tput sgr0)
red=$(tput setaf 1)
green=$(tput setaf 2)

castorheader="  🦫  "

usage() {
    echo "$castorheader Usage: $(basename "$0") [OPTIONS] COMMAND"
}

help() {
    usage
	echo "
${bold}COMMANDS${normal}
    ${bold}start${normal}
        starts castor
    ${bold}stop${normal}
        stop castor

${bold}OPTIONS${normal}
    ${bold}-h${normal}
        Display usage statement
    ${bold}-p${normal}=int
        Port to run the proxy (default=8080)
    ${bold}-m${normal}=socks|http
        Proxy mode, either SOCKS5 or HTTP CONNECT proxy (default=socks)
    ${bold}-t${normal}=int
        Number of Tor instances to run (default=5)
"
}

# Checking that docker is installed
which docker > /dev/null
if [ $? -eq 0 ]
then
    docker --version | grep "Docker version" > /dev/null
    if ! [ $? -eq 0 ]; then
        echo ${red}"Docker not found, please make sure it is installed before running castor (see https://docs.docker.com/engine/install/)"${normal}
        exit 1
    fi
else
    echo ${red}"Docker not found, please make sure it is installed before running castor (see https://docs.docker.com/engine/install/)"${normal}
    exit 1
fi

# Checking that docker-compose is installed
which docker-compose > /dev/null
if [ $? -eq 0 ]; then
    docker-compose version | grep "docker-compose version" > /dev/null
    if ! [ $? -eq 0 ]; then
        echo ${red}"Docker not found, please make sure it is installed before running castor (see https://docs.docker.com/engine/install/)"${normal}
        exit 1
    fi
else
    # docker-compose can also be called as 'docker compose'
    docker compose version | grep "Docker Compose version" > /dev/null
    if ! [ $? -eq 0 ]; then
        echo ${red}"Docker not found, please make sure it is installed before running castor (see https://docs.docker.com/engine/install/)"${normal}
        exit 1
    fi
fi

# Read and export values from .env file
if test -f .env; then
	export $(grep -v '^#' .env | xargs)
    # Set default values with env vars (if any)
    port=$PROXY_PORT
    mode=$PROXY_MODE
else
    # otherwise set default values
    port=8080
    mode=socks
fi

# set default value for tor instances
tors=5

# Reading options
while getopts 'hp:m:t:' OPTION; do
  case "$OPTION" in
    p) port=$OPTARG ;;
    m) mode=$OPTARG ;;
    t) tors=$OPTARG ;;
    h) 
        help
        exit 0
        ;;
    ?)
        help
        exit 1
        ;;
  esac
done
shift "$(($OPTIND -1))"

# Check port value
MIN_PORT=1
MAX_PORT=65535
if [ $((port)) -lt "$MIN_PORT" ] || [ $((port)) -gt "$MAX_PORT" ]; then
    echo ${red}"Invalid port number, port should be an interger between $MIN_PORT and $MAX_PORT"${normal}
    exit 1
fi

# Check mode value
if [ $mode != "socks" ] && [ $mode != "http" ]; then
    echo ${red}"Invalid proxy mode, accpeted modes are 'socks' and 'http'"${normal}
    exit 1
fi


# Check command argument
cmd=$1
if [ "$cmd" != "start" ] && [ "$cmd" != "stop" ]; then
    usage
    echo ${red}"Wrong usage, use -h flag to display help"${normal}
    exit 1
fi


# Starting castor proxy
if [ $cmd = "start" ]; then
    echo -ne "$castorheader Starting $mode proxy on port $port... \r"
    docker-compose up -d -V --scale tor=$tors  > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo ${green}"$castorheader Your castor $mode proxy is available at localhost:$port"${normal}
        exit 0
    else
        echo ${red}"Failed to start castor (try using docker commands, see README)"${normal}
        exit 1
    fi
fi

# Stopping castor proxy
if [ $cmd = "stop" ]; then
    echo -ne "$castorheader Stoping running castor proxy... \r"
    docker-compose stop  > /dev/null 2>&1
    if ! [ $? -eq 0 ]; then
        echo ${red}"Failed to stop castor (try using docker commands, see README)"${normal}
        exit 1
    fi
    docker-compose down  > /dev/null 2>&1
    if ! [ $? -eq 0 ]; then
        echo ${red}"Failed to stop castor (try using docker commands, see README)"${normal}
        exit 1
    fi
    echo ${green}"$castorheader Successfully stoped castor proxy"${normal}
    exit 0
fi
