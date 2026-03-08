FROM rust:bookworm AS backend-builder

# Build backend
RUN echo "Building backend..."

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/Cargo.toml backend/Cargo.lock ./

RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release --locked
RUN rm -rf src target/release/deps/betterlytics* target/release/betterlytics*

COPY backend/src ./src
COPY backend/assets ./assets

RUN cargo build --release --locked

####
# Build dashboard

FROM node:24-slim AS dashboard-builder

RUN echo "Building dashboard..."
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
# Build initializer

FROM node:24-slim AS initializer-builder

RUN echo "Building initializer..."
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY initializer/package.json .

RUN pnpm install

####
# Minify static files

FROM node:24-slim AS static-builder

RUN echo "Minifying static files..."
WORKDIR /app
COPY static/analytics.js .
RUN npx --yes esbuild analytics.js --minify --outfile=analytics.min.js

####
# Runtime image

FROM node:24-slim

RUN echo "Building runtime image..."
RUN apt-get update && apt-get install -y \
    supervisor \
    openssl \
    libssl3 \
    ca-certificates \
    certbot \
    curl \
    gettext-base \
    gnupg \
    && curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /usr/share/keyrings/nginx.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/nginx.gpg] http://nginx.org/packages/debian bookworm nginx" > /etc/apt/sources.list.d/nginx.list \
    && apt-get update && apt-get install -y nginx \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g prisma@6.9.0

# Copy backend
RUN echo "Copying backend..."
COPY --from=backend-builder /app/target/release/betterlytics /app/backend/app
COPY --from=backend-builder /app/assets /app/backend/assets

# Copy dashboard
RUN echo "Copying dashboard..."
COPY --from=dashboard-builder /app/public /app/dashboard/public
COPY --from=dashboard-builder /app/.next/standalone /app/dashboard/
COPY --from=dashboard-builder /app/.next/static /app/dashboard/.next/static

# Copy initializer dependencies
RUN echo "Copying initializer dependencies..."
COPY --from=initializer-builder /app/node_modules /app/initializer/node_modules

# Copy initializer source files
COPY initializer/package.json /app/initializer/
COPY scripts/ /app/initializer/scripts/
COPY migrations/ /app/initializer/migrations/
COPY dashboard/prisma/ /app/initializer/prisma/

# Copy minified analytics script for nginx
COPY --from=static-builder /app/analytics.min.js /usr/share/nginx/html/analytics.js
