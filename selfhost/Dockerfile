FROM rust:bookworm AS backend-builder

# Build backend
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/ .

RUN cargo fetch
RUN cargo build --release

####

FROM node:20-slim AS dashboard-builder

# Build dashboard

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pnpm install -g prisma@6.9.0

COPY dashboard/package*.json .
RUN pnpm fetch --prod

COPY dashboard/.env.build /.env
COPY dashboard/prisma ./prisma

RUN pnpm prisma generate

COPY dashboard/ .

RUN pnpm run build

####

FROM node:20-slim AS initializer-builder

# Build initializer

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY initializer/package.json .

RUN pnpm install

####

FROM node:20-slim

# Runtime image

RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    openssl \
    libssl3 \
    ca-certificates \
    certbot \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g prisma@6.9.0

# Copy backend
COPY --from=backend-builder /app/target/release/betterlytics /app/backend/app
COPY --from=backend-builder /app/assets /app/backend/assets

# Copy dashboard
COPY --from=dashboard-builder /app/public /app/dashboard/public
COPY --from=dashboard-builder /app/.next/standalone /app/dashboard/
COPY --from=dashboard-builder /app/.next/static /app/dashboard/.next/static

# Copy initializer dependencies
COPY --from=initializer-builder /app/node_modules /app/initializer/node_modules

# Copy initializer source files
COPY initializer/package.json /app/initializer/
COPY scripts/ /app/initializer/scripts/
COPY migrations/ /app/initializer/migrations/
COPY dashboard/prisma/ /app/initializer/prisma/

# Copy static files for nginx
COPY static/ /usr/share/nginx/html/

# Copy configs
RUN rm -f /etc/nginx/sites-enabled/default
RUN mkdir -p /etc/nginx/templates /var/www/certbot
COPY selfhost/nginx.conf /etc/nginx/templates/nginx.conf
COPY selfhost/nginx-ssl.conf /etc/nginx/templates/nginx-ssl.conf
COPY selfhost/supervisord.conf /etc/supervisor/conf.d/betterlytics.conf
COPY selfhost/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
