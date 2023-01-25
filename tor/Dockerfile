FROM alpine:latest

LABEL org.opencontainers.image.source https://github.com/joshhighet/gotham

RUN apk update
RUN apk upgrade
RUN apk add tor

COPY torrc /etc/tor/torrc
RUN chown -R tor /etc/tor

USER tor
ENTRYPOINT ["tor"]
CMD ["-f", "/etc/tor/torrc"]
