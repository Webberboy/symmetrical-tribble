# Admin User Creation Setup Guide

This guide explains how to enable admin users to create new user accounts through the admin panel, addressing the signup permission issues users are experiencing.

## Overview

The admin user creation feature allows administrators to:
- Create new user accounts with generated account numbers
- Bypass the standard signup flow that has permission issues
- Set up complete user profiles with checking and savings accounts
- Manage user creation directly from the admin dashboard

## Setup Instructions

### 1. Apply Database Permissions

Copy and run the SQL script `admin_user_creation_setup.sql` in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `admin_user_creation_setup.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

This script will:
- Grant necessary permissions to the service role for user management
- Create the `create_user_account` function for comprehensive user creation
- Create the `admin_create_user` function for simplified admin user creation
- Set up proper security and access controls

### 2. Verify the Setup

After running the SQL script, you should have:
- ✅ Service role permissions for auth schema management
- ✅ Functions for creating user accounts with generated account numbers
- ✅ Proper RLS policies for admin user creation

### 3. Test the Feature

1. Log in to the admin panel
2. Navigate to the Admin Dashboard
3. Click the **"Create User"** button in the header
4. Fill out the user creation form:
   - Email address
   - Password
   - Full name
   - Phone number (optional)
   - Initial deposit amount
5. Click **Create Account**

### 4. What Happens When You Create a User

The system will automatically:
- Create a new auth user with the provided credentials
- Generate a unique 12-digit account number (format: 40125XXXXXXX)
- Create a complete user profile with personal information
- Set up both checking and savings accounts
- Assign the 'user' role to the new account
- Set the account status to 'active'
- Apply the initial deposit to the checking account

### 5. Troubleshooting

#### If user creation fails:
1. Check that the admin user has proper permissions
2. Verify the SQL script was executed successfully
3. Check browser console for any JavaScript errors
4. Ensure all required fields are filled out

#### If account numbers aren't generating:
1. Verify the `create_user_account` function exists in your database
2. Check that the profiles table has the account_number column
3. Ensure the accounts table is properly set up

### 6. Security Considerations

- Only authenticated admin users can create accounts
- All user creation actions are logged
- Account numbers are automatically generated and unique
- Passwords are securely hashed using bcrypt
- Email addresses are automatically confirmed for admin-created accounts

### 7. Database Functions Created

#### `create_user_account`
Comprehensive function for creating users with full profile information.

#### `admin_create_user`
Simplified function for admin panel user creation with basic information.

Both functions return JSON objects with:
- `user_id`: The created user's UUID
- `account_number`: The generated checking account number
- `email`: The user's email address
- `full_name`: The user's full name
- `success`: Boolean indicating success/failure
- `message`: Status message or error description

## Next Steps

After setting up the admin user creation feature:

1. Test creating a few user accounts to ensure everything works correctly
2. Train other admin users on how to use the new feature
3. Monitor user creation logs for any issues
4. Consider implementing additional features like:
   - Bulk user creation
   - User import from CSV
   - Custom account number formats
   - Email notifications for created users

## Support

If you encounter any issues with the admin user creation feature:

1. Check the browser console for JavaScript errors
2. Review the Supabase logs for database errors
3. Verify all database permissions are properly set
4. Ensure the SQL script was executed without errors

For additional help, refer to the Supabase documentation or contact your development team.