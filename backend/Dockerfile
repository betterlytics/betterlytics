FROM rust:bookworm as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./

RUN cargo fetch

COPY . .

RUN cargo build --release

# --------------------

FROM debian:bookworm-slim as runner

# Install OpenSSL runtime libs
RUN apt-get update && apt-get install -y \
    libssl3 \
    curl ca-certificates iputils-ping dnsutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy just the compiled binary
COPY --from=builder /app/target/release/betterlytics /app/app
COPY --from=builder /app/assets /app/assets

CMD ./app
