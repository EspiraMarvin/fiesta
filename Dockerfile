# Development image build
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g prisma

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "dev"]

# Production image
FROM node:20-alpine AS builder

# onstall necessary packages for Prisma (OpenSSL)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Only copy built code and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Environment variables will control logging and DB
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

CMD ["node", "dist/server.js"]

