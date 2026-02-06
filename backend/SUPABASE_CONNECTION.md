# Supabase Connection Setup

## Your Supabase Project Details

- **Project ID**: `jeqpcicjhawaxgoqvenp`
- **URL**: `https://jeqpcicjhawaxgoqvenp.supabase.co`
- **Published Key**: `sb_publishable_ROb32pLySFlu0MiRdMm-0w_zKfs4Aju`
- **Secret Key**: `sb_secret_WiOMCsZIZ5enhljLHqDPyg_ZRUfgMbF`

## ⚠️ IMPORTANT: Get Database Connection String

You need to get the **DATABASE_URL** (PostgreSQL connection string) from Supabase:

1. Go to: https://supabase.com/dashboard/project/jeqpcicjhawaxgoqvenp
2. Navigate to: **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **URI** tab
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres
   ```

6. Replace `[YOUR-PASSWORD]` with your actual database password
7. Update `backend/.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public"
   ```

## Alternative: Connection Pooling (Recommended for Production)

Supabase also provides a connection pooling URL. You can use:
- **Connection Pooling** tab in Database settings
- Format: `postgresql://postgres.jeqpcicjhawaxgoqvenp:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

## After Setting DATABASE_URL

Once you've updated the `DATABASE_URL` in `.env`, run:

```bash
cd backend

# Test connection
npx prisma db pull

# Create and run migrations
npx prisma migrate dev --name init

# Or push schema directly (faster for development)
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## Verify Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can see all your tables.
