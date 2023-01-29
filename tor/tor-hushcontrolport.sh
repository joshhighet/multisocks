#!/bin/ash
tor -f /etc/tor/torrc
#| sed \
#-e "/New control connection opened from/d" \
#-e "/You have a ControlPort set to accept connections from a non-local address/d" \
#-e "/Tor can't help you if you use it wrong/d" \
#-e "/Read configuration file/d" \
#-e "/You specified a public address '0.0.0.0:9050' for SocksPort./d"
