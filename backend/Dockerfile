FROM node:20-slim

WORKDIR /app

# Install OpenSSL 3.0 for Prisma compatibility
# Debian Bookworm (12) uses OpenSSL 3.0
# Prisma binaryTargets configured for OpenSSL 3.0.x
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production=false

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Run Prisma migrations (will run on container start if DATABASE_URL is available)
# Note: Migrations should be run before starting the app

# Expose port
EXPOSE 3000

# Start script that runs migrations then starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
