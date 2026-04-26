#!/usr/bin/env bash
# Uklanja slučajno ostavljeni DATABASE_URL iz trenutne shell sesije (npr. stari supabase)
# tako da Prisma učitava isključivo backend/.env
set -e
cd "$(dirname "$0")/.."
unset DATABASE_URL
exec npx prisma migrate "$@"
