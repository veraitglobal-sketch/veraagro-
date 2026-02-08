FROM node:20-bullseye

WORKDIR /app

# Install OpenSSL 1.1.x for Prisma compatibility
# Debian Bullseye (11) includes OpenSSL 1.1.x
# Using full bullseye image (not slim) for better compatibility
RUN apt-get update -y && \
    apt-get install -y openssl libssl1.1 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

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

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
