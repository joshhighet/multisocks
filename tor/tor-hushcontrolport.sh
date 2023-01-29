#!/bin/ash
tor -f /etc/tor/torrc \
| grep -v "New control connection opened from" \
| grep -v "Tor can't help you if you use it wrong" \
| grep -v "Read configuration file" \
| grep -v "You have a ControlPort set to accept connections from a non-local address." \
| grep -v "You specified a public address '0.0.0.0:9050' for SocksPort."
