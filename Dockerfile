FROM node:20-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates xz-utils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG TYPST_VERSION=0.14.2
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then TYPST_TARGET="x86_64"; else TYPST_TARGET="aarch64"; fi && \
    curl -fsSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${TYPST_TARGET}-unknown-linux-musl.tar.xz" \
      -o /tmp/typst.tar.xz && \
    tar -xJf /tmp/typst.tar.xz -C /tmp && \
    mkdir -p bin && \
    cp /tmp/typst-*/typst bin/typst && \
    chmod 755 bin/typst && \
    rm -rf /tmp/typst*

COPY package.json package-lock.json* ./
COPY scripts ./scripts

RUN npm ci

COPY . .

RUN npm run build

# -----------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/bin ./bin

EXPOSE 3000

CMD ["node", "server.js"]
