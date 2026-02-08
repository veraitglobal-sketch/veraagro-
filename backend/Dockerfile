FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and other required libraries for Prisma
RUN apk add --no-cache openssl1.1-compat libc6-compat

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
