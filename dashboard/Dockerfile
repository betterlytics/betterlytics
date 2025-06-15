FROM node:20-slim AS base

# Setup env variables
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD
ARG CLICKHOUSE_URL
ARG CLICKHOUSE_DASHBOARD_USER
ARG CLICKHOUSE_DASHBOARD_PASSWORD
ARG NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT
ARG ENABLE_DASHBOARD_TRACKING

ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV CLICKHOUSE_URL=${CLICKHOUSE_URL}
ENV CLICKHOUSE_DASHBOARD_USER=${CLICKHOUSE_DASHBOARD_USER}
ENV CLICKHOUSE_DASHBOARD_PASSWORD=${CLICKHOUSE_DASHBOARD_PASSWORD}
ENV NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT=${NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT}
ENV ENABLE_DASHBOARD_TRACKING=${ENABLE_DASHBOARD_TRACKING}

# Disable Next Telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN printenv > /.env

RUN apt-get update -y && apt-get install -y openssl

# --------------------------

FROM base as builder

WORKDIR /app

RUN pnpm install -g prisma

COPY package*.json .
RUN pnpm fetch --prod

COPY ./prisma ./prisma

RUN pnpm prisma generate

COPY . .

RUN pnpm run build

# --------------------------

FROM base as runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

CMD node server.js
