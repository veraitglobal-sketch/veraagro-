# Migration Guide: Single Role to Multiple Roles

## Overview
This migration converts the User model from a single `role` field to a `roles` array field, allowing users to have multiple roles simultaneously.

## Database Migration Steps

### 1. Create Migration File
```bash
cd backend
npx prisma migrate dev --name add_multiple_roles
```

### 2. Manual SQL Migration (if needed)
If you have existing data, run this SQL to migrate:

```sql
-- Add roles column (as array)
ALTER TABLE "users" ADD COLUMN "roles" "UserRole"[] DEFAULT ARRAY['FARMER']::"UserRole"[];

-- Migrate existing role data to roles array
UPDATE "users" SET "roles" = ARRAY["role"]::"UserRole"[] WHERE "role" IS NOT NULL;

-- Make roles NOT NULL
ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL;

-- Drop old role column (after verifying migration)
-- ALTER TABLE "users" DROP COLUMN "role";
```

### 3. Update Prisma Schema
The schema has been updated to use `roles UserRole[]` instead of `role UserRole`.

## Backward Compatibility

The system maintains backward compatibility:
- Old tokens with `role` field are automatically converted to `roles` array
- Frontend supports both `user.role` and `user.roles`
- Guards check both formats

## Testing

1. Test login with existing users (should work with old format)
2. Test login with new users (should work with new format)
3. Test navigation shows links for all roles
4. Test guards allow access if user has any required role

## Notes

- All existing users will have their single role converted to an array
- New users can be created with multiple roles: `roles: [UserRole.GROWER, UserRole.COORDINATOR]`
- The `role` field can be removed from schema after migration is complete
