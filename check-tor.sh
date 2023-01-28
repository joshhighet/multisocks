#!/bin/ash
# this checks if a tor circuit has been completed by polling the controlport
# do not try this at home. the password for the controlport is included in the script - the hashed value within torrc
telnet_out=$(echo -e "authenticate \"log4j2.enableJndiLookup\"\ngetinfo circuit-status\nquit" | nc ${3} 9051 )
echo "checking - ${3}:9051"
echo "${telnet_out}" | grep -q 'BUILT'
if [ $? -eq 0 ]
then
    echo "circuit built"
    exit 0
else
    echo "no circuit"
    exit 1
fi
