# Backend Dockerfile
# Build context: repository root (not backend directory)
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json ./
COPY backend/prisma ./prisma/

# Install ALL dependencies (including dev for TypeScript build)
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vocavision

# Copy package.json for production install
COPY backend/package.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/data ./data

# Change ownership
RUN chown -R vocavision:nodejs /app

USER vocavision

EXPOSE 3001

ENV PORT=3001

# Start the application
CMD ["npm", "start"]
