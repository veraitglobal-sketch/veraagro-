#!/usr/bin/env bash
# Posle: psql -c 'TRUNCATE TABLE "_prisma_migrations";' na produkciji (backup prvo!), pozovi ovo iz backend/ sa ispravnim DATABASE_URL.
set -euo pipefail
cd "$(dirname "$0")/.."
unset DATABASE_PATH 2>/dev/null || true
unset DATABASE_URL 2>/dev/null || true
echo "Očekuje se DATABASE_URL u .env (javni Railway host). Kreiram zapis da je squash već primijenjen."
npx prisma migrate resolve --applied 20260426200000_squash_baseline
echo "Gotovo. npx prisma migrate status treba biti u redu."
