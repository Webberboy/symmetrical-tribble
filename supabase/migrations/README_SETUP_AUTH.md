# Heritage Banking Authentication Setup Guide

## Overview
This directory contains the SQL migrations needed to set up all authentication tables for the Heritage Banking application.

## Migration Files

### 1. `20251018000010_create_auth_tables.sql`
Creates all the core authentication tables:
- `profiles` - Main user profiles
- `accounts` - Bank accounts (checking/savings)
- `user_roles` - User role assignments
- `pending_signups` - Temporary signup data storage
- `admin_users` - Admin user management
- RPC functions for authentication
- Row Level Security (RLS) policies
- Triggers for auto-updating timestamps

### 2. `20251018000015_setup_welcome_email_webhook.sql`
Sets up the webhook configuration for sending welcome emails when new profiles are created.

## How to Run These Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to your project directory
cd c:\Users\S D\newgi\bank-weave-ui

# Apply the migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/20251018000010_create_auth_tables.sql
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Run them in order:
   - First: `20251018000010_create_auth_tables.sql`
   - Second: `20251018000015_setup_welcome_email_webhook.sql`

### Option 3: Using Database URL (Direct Connection)
```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:your-password@your-project.supabase.co:5432/postgres"

# Run the SQL files
psql $DATABASE_URL -f supabase/migrations/20251018000010_create_auth_tables.sql
psql $DATABASE_URL -f supabase/migrations/20251018000015_setup_welcome_email_webhook.sql
```

## Tables Created

### Core Authentication Tables

#### `profiles`
Main user profile table that extends Supabase auth.users:
```sql
- id (UUID, PK, references auth.users.id)
- full_name, first_name, last_name
- email, phone, date_of_birth, ssn
- address fields (street, city, state, zip, country)
- account_type, account_number (unique)
- balance, account_status
- is_banned, ban_reason
- ID document fields
- timestamps (created_at, updated_at)
```

#### `accounts`
Bank accounts for each user:
```sql
- id (UUID, PK)
- user_id (FK to profiles.id)
- account_number (unique)
- account_type ('checking' or 'savings')
- balance, available_balance
- account_status, interest_rate
- timestamps
```

#### `user_roles`
Role assignments:
```sql
- id (UUID, PK)
- user_id (FK to profiles.id, unique)
- role ('user' or 'admin')
- created_at
```

#### `pending_signups`
Temporary storage during signup process:
```sql
- id (UUID, PK)
- auth_user_id (FK to auth.users.id)
- email
- signup_data (JSONB)
- created_at
```

#### `admin_users`
Admin user management:
```sql
- id (UUID, PK)
- user_id (FK to profiles.id, unique)
- email, role, permissions (JSONB)
- is_active
- timestamps
```

## RPC Functions Created

### `get_email_by_account(account_num TEXT)`
Returns email address for a given account number.

### `is_user_admin(user_id_param UUID)`
Checks if a user has admin privileges.

## Row Level Security (RLS) Policies

All tables have RLS enabled with appropriate policies:
- Users can only view/update their own profiles and accounts
- Users can only view their own roles
- Admins can view admin user information
- Users can manage their own pending signups

## Webhook Setup for Welcome Emails

After running the migrations, you need to set up the webhook in Supabase:

1. Go to **Supabase Dashboard > Database > Webhooks**
2. Create a new webhook:
   - **Table**: `profiles`
   - **Events**: `INSERT`
   - **URL**: `https://your-project-ref.supabase.co/functions/v1/send-welcome-email`
   - **Headers**: Add any required authentication headers
   - **Enable**: Toggle ON

## Verification

After running the migrations, verify the setup:

```sql
-- Check if all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'accounts', 'user_roles', 'pending_signups', 'admin_users');

-- Check if RPC functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_email_by_account', 'is_user_admin');

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure your Supabase service role key has sufficient permissions
2. **Table Already Exists**: The migrations use `CREATE TABLE IF NOT EXISTS` to handle this
3. **RLS Policy Conflicts**: Existing policies are dropped before creating new ones
4. **Webhook Not Working**: Check the edge function URL and authentication headers

### Reset Everything
If you need to start over, you can drop all tables:
```bash
-- WARNING: This will delete all data!
-- Use the drop_all_tables.sql file if needed
```

## Next Steps

After running these migrations:

1. **Set up environment variables** in your `.env` file
2. **Deploy your edge functions** if not already done
3. **Configure the welcome email webhook** in Supabase dashboard
4. **Test the signup process** to ensure everything works
5. **Create your first admin user** by setting `is_admin` to true in the profiles table

## Support

If you encounter issues:
- Check Supabase logs in the dashboard
- Verify your database connection settings
- Ensure all required environment variables are set
- Check the browser console for any client-side errors