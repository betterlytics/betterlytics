#!/bin/sh
# Runs with the container's configured environment only: nothing entrypoint.sh exported is visible here,
# so the TLS default and the host are resolved again.
if [ "${TLS:-off}" = "auto" ]; then
    host="${PUBLIC_URL#*://}"
    host="${host%/}"
    curl -fsk -o /dev/null --resolve "$host:443:127.0.0.1" "https://$host/" || exit 1
else
    curl -fs -o /dev/null http://localhost/ || exit 1
fi
curl -fs -o /dev/null http://127.0.0.1:3001/health || exit 1
