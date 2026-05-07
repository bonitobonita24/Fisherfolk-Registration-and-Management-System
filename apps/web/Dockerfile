# Stage 1 — install dependencies (monorepo-aware)
FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/jobs/package.json ./packages/jobs/package.json
COPY packages/storage/package.json ./packages/storage/package.json
RUN pnpm install --frozen-lockfile

# Stage 2 — build
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/ ./
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd packages/db && pnpm db:generate
RUN pnpm turbo run build --filter=@frms/web
RUN find /app -name "libquery_engine-linux-musl*" -type f | head -1 | xargs -I{} cp {} /tmp/prisma-engine.so.node
RUN find /app -path "*/.prisma/client" -type d > /tmp/prisma-client-dirs.txt

# Stage 3 — minimal production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /tmp/prisma-engine.so.node /tmp/prisma-engine.so.node
COPY --from=builder /tmp/prisma-client-dirs.txt /tmp/prisma-client-dirs.txt
RUN while IFS= read -r dir; do \
      rel="${dir#/app/}"; \
      mkdir -p "$rel"; \
      cp /tmp/prisma-engine.so.node "$rel/libquery_engine-linux-musl-openssl-3.0.x.so.node"; \
    done < /tmp/prisma-client-dirs.txt && \
    rm /tmp/prisma-engine.so.node /tmp/prisma-client-dirs.txt
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
