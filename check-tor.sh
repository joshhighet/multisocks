#!/bin/ash
# this checks if a tor circuit has been completed by polling the controlport
# it is used by haproxy to as a health check for the various backends
# the password for the controlport is included in the script - the hashed value within torrc

if [ -z "${3}" ]
then
    if [ -z "${1}" ]
    then
        hostaddr="localhost"
    else
        hostaddr=${1}
    fi
else
    hostaddr=${3}
fi

if ! nc -z ${hostaddr} 9051 2>/dev/null
then
    echo "healthcheck: controlport (${hostaddr}:9051) is not accepting connections"
    exit 1
fi

# i dont quite know *why* this works, but it acts as a keepalive for the controlport...
# https://github.com/joshhighet/multisocks/issues/1
curl --silent --max-time 2 --socks5-hostname ${hostaddr}:9050 -I multisocks-haproxy-1:1337

telnet_out=$(echo -e "authenticate \"log4j2.enableJndiLookup\"\ngetinfo circuit-status\nquit" | nc ${hostaddr} 9051 )
echo "${telnet_out}" | grep -q 'BUILT'
if [ $? -eq 0 ]
then
    # echo "healthcheck: (${hostaddr}:9051) has built at-least one circuit"
    exit 0
else
    echo "healthcheck: (${hostaddr}:9051) has not finished building any circuits"
    exit 1
fi
