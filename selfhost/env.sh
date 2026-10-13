#!/bin/sh
# Sourced by entrypoint.sh in both modes, before anything touches the databases.
# Runs under dash: no [[ ]], no arrays, no ${v//a/b}.

fail() {
    echo "betterlytics: $*" >&2
    exit 1
}

check_version() {
    [ "$APP_VERSION" = "dev" ] && return 0
    [ "$SKIP_VERSION_CHECK" = "true" ] && return 0
    [ "$APP_VERSION" = "$BETTERLYTICS_VERSION" ] && return 0
    echo "Configuration/image version mismatch."
    echo "  betterlytics-selfhost repo: $BETTERLYTICS_VERSION"
    echo "  image:                      $APP_VERSION"
    if [ "$(printf '%s\n%s\n' "$BETTERLYTICS_VERSION" "$APP_VERSION" | sort -V | head -n1)" = "$BETTERLYTICS_VERSION" ]; then
        echo "The repo is older: run \`git pull\` in betterlytics-selfhost, then \`docker compose up -d --wait\`."
    else
        echo "The image is older: check docker-compose.override.yml for an image override, or run \`docker compose pull\`."
    fi
    exit 1
}

# Tests for non-empty, not for set: compose passes `DOMAIN=` from .env as present but empty.
check_retired_names() {
    if [ -z "$PUBLIC_URL" ]; then
        if [ -n "$DOMAIN$HTTP_SCHEME$FORCE_HTTP_SCHEME" ]; then
            _scheme="https"
            [ "$FORCE_HTTP_SCHEME" = "http" ] && _scheme="http"
            _tls="off"
            [ "$HTTP_SCHEME" = "https" ] && _tls="auto"
            echo "DOMAIN, HTTP_SCHEME and FORCE_HTTP_SCHEME are no longer read. Replace them in .env with:"
            echo "  PUBLIC_URL=${_scheme}://${DOMAIN:-<your domain>}"
            echo "  TLS=${_tls}"
            # A hand-written override may interpolate ${HTTPS_PORT}; without the variable it publishes a random port.
            echo "HTTPS_PORT is no longer read either. If docker-compose.override.yml uses \${HTTPS_PORT}, write 443 there before removing it from .env."
            echo "Then run \`docker compose up -d --wait\` again."
            exit 1
        fi
        fail "PUBLIC_URL is not set. Set it in .env to the address browsers use, for example PUBLIC_URL=https://analytics.example.com."
    fi
    if [ -n "$DOMAIN$HTTP_SCHEME$FORCE_HTTP_SCHEME" ]; then
        echo "WARNING: DOMAIN, HTTP_SCHEME and FORCE_HTTP_SCHEME in .env are ignored; PUBLIC_URL and TLS are used. Remove them." >&2
    fi
}

# Normalises PUBLIC_URL, defaults TLS, and sets BL_PUBLIC_HOST to host or host:port.
resolve_public_url() {
    # Never echo the value here: it may hold credentials.
    case "$PUBLIC_URL" in
        *@*) fail "PUBLIC_URL must not contain credentials. Use only scheme, host and optional port, for example https://analytics.example.com." ;;
    esac
    _url=$(printf '%s' "$PUBLIC_URL" | tr 'A-Z' 'a-z')
    case "$_url" in
        http://*)
            _scheme="http"
            _default_port="80"
            ;;
        https://*)
            _scheme="https"
            _default_port="443"
            ;;
        *) fail "PUBLIC_URL must start with http:// or https:// (got '$PUBLIC_URL')." ;;
    esac
    BL_PUBLIC_HOST="${_url#*://}"
    BL_PUBLIC_HOST="${BL_PUBLIC_HOST%/}"
    case "$BL_PUBLIC_HOST" in
        ''|:*|*/*|*\?*|*\#*)
            fail "PUBLIC_URL must be only scheme, host and optional port, for example https://analytics.example.com (got '$PUBLIC_URL')." ;;
    esac
    case "$BL_PUBLIC_HOST" in
        \[*) ;;
        *:*)
            _port="${BL_PUBLIC_HOST##*:}"
            case "$_port" in
                ''|*[!0-9]*|0*|??????*) fail "The port in PUBLIC_URL must be a number between 1 and 65535 without leading zeros (got '$PUBLIC_URL')." ;;
            esac
            # Browsers leave the default port out of Origin, so logins would never match.
            [ "$_port" != "$_default_port" ] || fail "Leave the default port out of PUBLIC_URL: use ${_scheme}://${BL_PUBLIC_HOST%:*}."
            ;;
    esac

    TLS="${TLS:-off}"
    case "$TLS" in
        auto|off) ;;
        *) fail "TLS must be auto or off (got '$TLS')." ;;
    esac

    if [ "$TLS" = "auto" ]; then
        [ "$_scheme" = "https" ] || fail "TLS=auto needs an https:// PUBLIC_URL. For plain HTTP set TLS=off."
        case "$BL_PUBLIC_HOST" in
            *:*|localhost|*.localhost)
                fail "TLS=auto needs a public hostname without a port in PUBLIC_URL (got '$BL_PUBLIC_HOST'). Behind your own proxy or on a custom port set TLS=off." ;;
        esac
        if printf '%s' "$BL_PUBLIC_HOST" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
            fail "TLS=auto cannot get a certificate for an IP address. Use a hostname, or set TLS=off."
        fi
        # Let's Encrypt HTTP-01 reaches the container only through host port 80.
        [ "$HTTP_PORT" = "80" ] || fail "TLS=auto requires HTTP_PORT=80 in .env and a host mapping of port 443 (setup.sh 'Standalone' writes both). Or set TLS=off behind your own reverse proxy."
    fi

    PUBLIC_URL="${_scheme}://${BL_PUBLIC_HOST}"
    export PUBLIC_URL TLS
}

# Empty counts as unset (an empty `X=` line in .env arrives as ""); an explicit false is kept.
apply_selfhost_defaults() {
    export ENABLE_UPTIME_MONITORING="${ENABLE_UPTIME_MONITORING:-true}"
    export ENABLE_PUBLIC_STATUS_PAGES="${ENABLE_PUBLIC_STATUS_PAGES:-true}"
    export SESSION_REPLAYS_ENABLED="${SESSION_REPLAYS_ENABLED:-true}"
    export ALLOW_PRIVATE_TARGETS="${ALLOW_PRIVATE_TARGETS:-true}"
    export BACKGROUND_JOBS_ENABLED="${BACKGROUND_JOBS_ENABLED:-true}"
    export LOG_LEVEL="${LOG_LEVEL:-info}"
    export WORKER_CLICKHOUSE_WRITE_USER="${WORKER_CLICKHOUSE_WRITE_USER:-worker}"
    export CLICKHOUSE_URL="${CLICKHOUSE_URL:-http://clickhouse:8123}"

    # Always assigned: login origin, links and tracking origin must be the same address.
    export PUBLIC_BASE_URL="$PUBLIC_URL"
    export AUTH_URL="$PUBLIC_URL"
    export PUBLIC_ANALYTICS_BASE_URL="$PUBLIC_URL"
    export PUBLIC_TRACKING_SERVER_ENDPOINT="$PUBLIC_URL"
}
