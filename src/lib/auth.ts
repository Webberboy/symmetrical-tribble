import { supabase } from "@/integrations/supabase/client";

/**
 * Validate account credentials without creating a session
 * Just checks if account number and password are correct
 * @param accountNumber - The user's account number (e.g., ACC123456)
 * @param password - The user's password
 * @returns Promise with validation result and user email
 */
export const validateCredentials = async (accountNumber: string, password: string) => {
  try {
    // Step 1: Get email from account number using RPC
    const { data: userEmail, error: rpcError } = await supabase
      .rpc('get_email_by_account', { account_num: accountNumber.toUpperCase() }) as { data: string | null, error: any };

    if (rpcError || !userEmail) {
      return {
        valid: false,
        email: null,
        userId: null,
        isBanned: false,
        banReason: null,
        error: 'Invalid account number or password'
      };
    }

    // Step 2: Try to sign in to validate password (creates temporary session)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (error || !data.user) {
      return {
        valid: false,
        email: null,
        userId: null,
        isBanned: false,
        banReason: null,
        error: 'Invalid account number or password'
      };
    }

    // Step 3: Check if user is banned
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_banned, ban_reason')
      .eq('id', data.user.id)
      .single();

    // Step 4: Immediately sign out (we don't want session yet)
    await supabase.auth.signOut();

    if (profileError) {
    }

    // If user is banned, return banned status
    if (profile?.is_banned) {
      return {
        valid: false,
        email: userEmail,
        userId: data.user.id,
        isBanned: true,
        banReason: profile.ban_reason || 'Your account has been suspended',
        error: 'Account suspended'
      };
    }

    // Step 5: Return validation success with user info
    return {
      valid: true,
      email: userEmail,
      userId: data.user.id,
      isBanned: false,
      banReason: null,
      error: null
    };
  } catch (error) {
    return {
      valid: false,
      email: null,
      userId: null,
      isBanned: false,
      banReason: null,
      error: 'An error occurred during validation'
    };
  }
};

/**
 * Get user profile data by user ID (no session required if RLS allows)
 * @param userId - The user's ID
 * @returns Promise with user profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    if (!profile) {
      return null;
    }

    return profile;
  } catch (error) {
    return null;
  }
};

/**
 * DEPRECATED: Use validateCredentials instead
 * This function creates a session which we don't want during validation
 */
export const signInWithAccountNumber = validateCredentials;