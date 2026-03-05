FROM node:20-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates xz-utils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG TYPST_VERSION=0.14.2
ENV TYPST_PACKAGE_CACHE_PATH=/app/.typst-packages
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then TYPST_TARGET="x86_64"; else TYPST_TARGET="aarch64"; fi && \
    curl -fsSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${TYPST_TARGET}-unknown-linux-musl.tar.xz" \
      -o /tmp/typst.tar.xz && \
    tar -xJf /tmp/typst.tar.xz -C /tmp && \
    mkdir -p bin && \
    cp /tmp/typst-*/typst bin/typst && \
    chmod 755 bin/typst && \
    rm -rf /tmp/typst*

# Pre-download the basic-resume package so it's cached at runtime
RUN printf '#import "@preview/basic-resume:0.2.9": *\ntest\n' > /tmp/warmup.typ && \
    bin/typst compile /tmp/warmup.typ /tmp/warmup.pdf 2>&1 || true && \
    rm -f /tmp/warmup.typ /tmp/warmup.pdf && \
    test -d "$TYPST_PACKAGE_CACHE_PATH/preview/basic-resume" || \
      (echo "ERROR: Typst package cache not populated" && exit 1)

COPY package.json package-lock.json* ./
COPY scripts ./scripts

RUN npm ci

COPY . .

RUN npm run build

# -----------------------------------------------------------
FROM node:20-slim AS runner

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV TYPST_PACKAGE_CACHE_PATH=/app/.typst-packages

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/.typst-packages ./.typst-packages

EXPOSE 3000

CMD ["node", "server.js"]
