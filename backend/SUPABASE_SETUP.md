# Supabase Setup Instructions

## 1. Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection string** section
4. Copy the **URI** connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```

## 2. Create .env File

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Then edit `.env` and add your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_REF.supabase.co:5432/postgres?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
NODE_ENV=development
```

## 3. Run Prisma Migrations

After setting up your `.env` file with the Supabase connection string, run:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# Or if you want to push schema without migrations (for development)
npx prisma db push
```

## 4. Verify Connection

Test the connection:

```bash
npx prisma studio
```

This will open Prisma Studio where you can view your database tables.

## 5. Optional: Supabase API Keys

If you need to make direct API calls to Supabase (for storage, auth, etc.), add these to `.env`:

```env
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

You can find these in **Settings** → **API** in your Supabase dashboard.

## Important Notes

- **Never commit `.env` file to git** - it's already in `.gitignore`
- **Use strong JWT_SECRET** in production
- **Connection string includes password** - keep it secure
- Supabase uses PostgreSQL, so all Prisma features work normally
