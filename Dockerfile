FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
# scripts/ is copied with the manifests because the postinstall hook
# (copy-pdf-worker.mjs) runs as part of `npm ci` and fails the install if the
# file is absent.
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN node scripts/copy-pdf-worker.mjs && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Docker sets HOSTNAME to the container id; the standalone server would bind to
# that address and the loopback healthcheck below would never reach it.
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
