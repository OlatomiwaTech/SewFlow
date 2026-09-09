FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile

COPY backend backend
RUN DATABASE_URL=postgresql://localhost:5432/sewflow DIRECT_URL=postgresql://localhost:5432/sewflow pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
RUN DATABASE_URL=postgresql://localhost:5432/sewflow DIRECT_URL=postgresql://localhost:5432/sewflow pnpm --filter backend prisma:generate

WORKDIR /app/backend
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -q -O - http://127.0.0.1:5000/api/health/live || exit 1
CMD ["node", "dist/server.js"]
