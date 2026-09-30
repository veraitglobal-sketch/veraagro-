-- Add SEED_PRODUCER role for factory portal users
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SEED_PRODUCER';
