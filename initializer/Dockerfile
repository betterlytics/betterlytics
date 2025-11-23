FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl

ENV NODE_ENV="production"

WORKDIR /app

RUN pnpm install -g prisma@6.9.0

COPY ./package.json .

RUN pnpm install

COPY ./scripts ./scripts
COPY ./migrations ./migrations
COPY ./prisma ./prisma

CMD pnpm run migrate-clickhouse && prisma migrate deploy --schema ./prisma/schema.prisma
