FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update -y && apt-get install -y openssl

RUN pnpm install -g prisma
RUN pnpm install -g clickhouse@^2.6.0
RUN pnpm install -g clickhouse-migrations@^1.0.4
RUN pnpm install -g @clickhouse/client@^1.0.4
RUN pnpm install -g dotenv@^16.5.0

WORKDIR /app

COPY ./scripts/run-migrations.js ./scripts/run-migrations.js
COPY ./migrations ./migrations
COPY ./prisma ./prisma

CMD ["node", "scripts/run-migration.js", "&&", "prisma", "migrate", "deploy", "--schema", "./prisma/schema.prisma"]
