FROM node:20-slim AS base

# Disable Next Telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Setup pnpm
ENV PNPM_HOME="/home/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update -y && apt-get install -y openssl

# --------------------------

FROM base AS builder

WORKDIR /app

RUN pnpm install -g prisma

COPY package*.json .
RUN pnpm fetch --prod

COPY .env.build /.env
COPY ./prisma ./prisma

RUN pnpm prisma generate

COPY . .

RUN pnpm run build

# --------------------------

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs

ENV COREPACK_HOME=/home/nextjs/.cache/corepack

RUN pnpm install -g prisma

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

CMD prisma migrate deploy && node server.js
