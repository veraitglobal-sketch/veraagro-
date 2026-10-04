# Build context MUST be the monorepo root (veraagrar/), not backend/ alone.
# Railway: Root Directory = empty; Dockerfile path = backend/Dockerfile
# CLI: cd veraagrar && railway up

FROM node:20-slim

WORKDIR /repo

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# backend/src imports ../../../shared — shared must sit beside backend in /repo
COPY shared ./shared

COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

WORKDIR /repo/backend

RUN npm ci --only=production=false && npx prisma generate

COPY backend/ ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:release"]
