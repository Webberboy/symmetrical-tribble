// =====================================================
// ADMIN AUTHENTICATION METHODS
// =====================================================
// Multiple ways to authenticate admin users
// Choose the method that best fits your needs
// =====================================================

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// METHOD 1: ADMIN TABLE (RECOMMENDED - MOST SECURE)
// =====================================================
// Uses separate admin_users table
// Run CREATE_ADMIN_TABLE.sql first
export async function checkAdminTable(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

// Get admin role and permissions
export async function getAdminRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role, permissions, email')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

// =====================================================
// METHOD 2: EMAIL WHITELIST (SIMPLE - CURRENT METHOD)
// =====================================================
// Checks email against environment variable list
export function checkAdminEmail(email: string): boolean {
  const envAdminEmails = import.meta.env.VITE_ADMIN_EMAILS || '';
  const ADMIN_EMAILS = envAdminEmails 
    ? envAdminEmails.split(',').map((e: string) => e.trim().toLowerCase())
    : ['admin@heritagebk.org'];

  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// =====================================================
// METHOD 3: AUTH METADATA (NO DATABASE QUERY)
// =====================================================
// Store admin flag in auth.users user_metadata
// Set via Supabase dashboard or Auth API
export async function checkAuthMetadata(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return false;

    // Check user_metadata for admin flag
    return user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true;
  } catch (error) {
    return false;
  }
}

// =====================================================
// METHOD 4: SUPABASE RPC FUNCTION (SERVER-SIDE)
// =====================================================
// Database function checks admin status (most secure)
// No RLS policy issues
export async function checkAdminRPC(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_user_admin', {
      user_id_param: userId
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch (error) {
    return false;
  }
}

// =====================================================
// METHOD 5: SUPABASE AUTH ADMIN API
// =====================================================
// Use Supabase service role to check users
// Requires service role key (backend only)
export async function checkAdminServiceRole(email: string, serviceKey: string): Promise<boolean> {
  try {
    // This should be done on backend, not frontend!
    // Just showing the concept
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        }
      }
    );
    
    const users = await response.json();
    const adminUser = users.find((u: any) => 
      u.email === email && u.user_metadata?.is_admin === true
    );
    
    return !!adminUser;
  } catch (error) {
    return false;
  }
}

// =====================================================
// METHOD 6: COMBINED APPROACH (MOST FLEXIBLE)
// =====================================================
// Try multiple methods in order of preference
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return false;

    // Method 1: Check admin table (most secure)
    const tableCheck = await checkAdminTable(user.id);
    if (tableCheck) return true;

    // Method 2: Check auth metadata (no DB query needed)
    if (user.user_metadata?.is_admin === true) return true;
    if (user.app_metadata?.is_admin === true) return true;

    // Method 3: Check email whitelist (fallback)
    if (user.email && checkAdminEmail(user.email)) return true;

    // Method 4: Try RPC function
    try {
      const rpcCheck = await checkAdminRPC(user.id);
      if (rpcCheck) return true;
    } catch (e) {
      // RPC function might not exist, continue
    }

    return false;
  } catch (error) {
    return false;
  }
}

// =====================================================
// HELPER: GET CURRENT ADMIN USER INFO
// =====================================================
export async function getAdminUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;

    const isAdminUser = await isAdmin();
    if (!isAdminUser) return null;

    // Try to get role from admin table
    const adminRole = await getAdminRole(user.id);

    return {
      id: user.id,
      email: user.email,
      role: adminRole?.role || 'admin',
      permissions: adminRole?.permissions || {},
      isAdmin: true,
    };
  } catch (error) {
    return null;
  }
}

// =====================================================
// USAGE EXAMPLES
// =====================================================

/*
// Example 1: Simple check
const isAdminUser = await isAdmin();
if (!isAdminUser) {
  toast.error('Admin access required');
  return;
}

// Example 2: Get admin info
const adminUser = await getAdminUser();
if (!adminUser) {
  toast.error('Admin access required');
  return;
}

// Example 3: Check specific method
const hasAccess = await checkAdminTable(userId);

// Example 4: Email check
if (checkAdminEmail('admin@heritagebk.org')) {
  // Allow access
}
*/
