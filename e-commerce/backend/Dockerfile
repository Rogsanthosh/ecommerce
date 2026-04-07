# Use official Node full runtime (bypasses all OpenSSL/Alpine bugs)
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

# Clean cache and install
RUN npm cache clean --force && npm install

COPY . .

# 🔥 BUST THE RENDER DOCKER CACHE 🔥
# By changing this number, Render is forced to run Prisma fresh instead of using the old Alpine cache!
ENV BUST_DOCKER_CACHE=1

RUN npx prisma generate

# -------------------------
# Production Image
FROM node:20

WORKDIR /app

# Copy dependencies and built code from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]
