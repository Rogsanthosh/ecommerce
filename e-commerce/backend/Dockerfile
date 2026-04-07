# Use official Node runtime as a parent image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including Prisma CLI)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# -------------------------
# Production Image
FROM node:20-alpine

WORKDIR /app

# Copy dependencies and built code from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Make sure to set production environment
ENV NODE_ENV=production

# Expose port (Render automatically uses PORT variable)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
