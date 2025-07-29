FROM node:20-slim AS base

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

ENV POSTGRES_URL="mock:string"
RUN pnpm prisma generate
ENV POSTGRES_URL=""

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
