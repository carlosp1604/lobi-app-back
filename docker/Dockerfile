# ==========================================
# Stage 1: Compilation (Build Stage)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY ../package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY .. .

RUN yarn build

RUN yarn install --production --frozen-lockfile

# ==========================================
# Stage 2: Production (Production Stage)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
