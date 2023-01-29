FROM alpine:latest
LABEL org.opencontainers.image.source https://github.com/joshhighet/multisocks/tor
RUN apk update
RUN apk upgrade
RUN apk add tor
COPY torrc /etc/tor/torrc
RUN chown -R tor /etc/tor
COPY tor-hushcontrolport.sh /usr/local/bin/tor-hushcontrolport.sh
RUN chmod +x /usr/local/bin/tor-hushcontrolport.sh
USER tor
ENTRYPOINT ["tor"]
CMD ["-f", "/etc/tor/torrc"]
#CMD ["tor-hushcontrolport.sh"]