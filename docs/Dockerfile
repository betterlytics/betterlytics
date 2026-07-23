FROM node:20-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

# --------------------------

FROM base as builder

WORKDIR /app

COPY package*.json .
# zod >= 4.4 breaks nextra's MDX prerender.
RUN npm pkg set "pnpm.overrides[nextra>zod]=4.3.2" "pnpm.overrides[nextra-theme-docs>zod]=4.3.2"
RUN pnpm install

COPY . .

RUN pnpm run build

# --------------------------

FROM base as runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3002

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

CMD node server.js