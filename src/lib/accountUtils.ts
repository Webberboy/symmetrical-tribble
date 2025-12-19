import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * Generate a unique account number on the frontend
 * Format: 401 (bank code) + 25 (branch code) + 7-digit account number
 * Example: 401251234567 (12 digits total)
 * Professional banking format matching major US banks
 * @returns Promise<string> - A unique account number
 */
export const generateAccountNumber = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Unity Capital Professional Format: 401-25-XXXXXXX
const bankCode = '401';        // Unity Capital routing prefix
    const branchCode = '25';       // Default branch code
    const accountDigits = Math.floor(Math.random() * 10000000); // 7-digit account number
    const accountNumber = bankCode + branchCode + accountDigits.toString().padStart(7, '0');

    try {
      // Check if account number already exists
      const { data, error } = await supabase
        .from('profiles')
        .select('account_number')
        .eq('account_number', accountNumber)
        .maybeSingle(); // Use maybeSingle instead of single

      if (!data) {
        // No rows found - account number is unique
        return accountNumber;
      }

      if (error) {
        // If it's a network error, retry after a short delay
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          continue;
        }
        throw new Error('Failed to generate unique account number');
      }

      // If we get here, the account number exists, try again
      attempts++;
    } catch (error) {
      throw error;
    }
  }

  throw new Error('Failed to generate unique account number after maximum attempts');
};

/**
 * Create a user profile manually after successful auth signup
 * @param userId - The user ID from Supabase auth
 * @param profileData - The profile data from the signup form
 * @returns Promise<{profile: any, accountNumber: string}>
 */
export const createUserProfile = async (userId: string, profileData: any) => {
  try {
    // Generate unique account number
    const accountNumber = await generateAccountNumber();

    // Create profile record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: profileData.full_name,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        date_of_birth: profileData.date_of_birth || null,
        ssn: profileData.ssn || null,
        street_address: profileData.address?.street || null,
        city: profileData.address?.city || null,
        state: profileData.address?.state || null,
        zip_code: profileData.address?.zip || null,
        country: profileData.address?.country || 'United States',
        account_type: profileData.account_type,
        id_document_uploaded: profileData.id_document_uploaded || false,
        id_document_data: profileData.id_document_data || null,
        id_document_filename: profileData.id_document_filename || null,
        id_document_type: profileData.id_document_type || null,
        id_document_url: profileData.id_document_url || null,
        account_number: accountNumber,
        balance: 0.00,
        account_status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    return { profile, accountNumber };
  } catch (error) {
    throw error;
  }
};

/**
 * Assign a role to a user
 * @param userId - The user ID from Supabase auth
 * @param role - The role to assign (default: 'user')
 * @returns Promise<any>
 */
export const assignUserRole = async (userId: string, role: 'user' | 'admin' = 'user') => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign role: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create checking and savings accounts for a user
 * Checking account uses existing account number from profile
 * Savings account gets a new unique account number
 * @param userId - The user ID from Supabase auth
 * @param checkingAccountNumber - The account number to use for checking account
 * @param session - The user's session for authenticated requests
 * @returns Promise<{checkingAccountNumber: string, savingsAccountNumber: string}>
 */
export const createUserAccounts = async (userId: string, checkingAccountNumber: string, session?: any) => {
  try {
    // Use authenticated client if session is provided
    let client = supabase;
    if (session?.access_token) {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      client = createClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        }
      );
    }

    // Create checking account with existing account number
    const { error: checkingError } = await client
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: checkingAccountNumber,
        account_type: 'checking',
        account_name: 'My Checking Account',
        balance: 0.00,
        available_balance: 0.00,
        account_status: 'active'
      });

    if (checkingError) {
      throw new Error(`Failed to create checking account: ${checkingError.message}`);
    }

    // Generate unique account number for savings account
    const savingsAccountNumber = await generateAccountNumber();

    // Create savings account with new unique account number
    const { error: savingsError } = await client
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: savingsAccountNumber,
        account_type: 'savings',
        account_name: 'My Savings Account',
        balance: 0.00,
        available_balance: 0.00,
        account_status: 'active',
        interest_rate: 0.0100 // 1% interest rate for savings
      });

    if (savingsError) {
      throw new Error(`Failed to create savings account: ${savingsError.message}`);
    }

    return { checkingAccountNumber, savingsAccountNumber };
  } catch (error) {
    throw error;
  }
};

/**
 * Complete user signup process with profile and role creation
 * @param userId - The user ID from Supabase auth
 * @param profileData - The profile data from the signup form
 * @param session - The user's session for authenticated requests (optional)
 * @returns Promise<{profile: any, role: any, accountNumber: string}>
 */
export const completeUserSignup = async (userId: string, profileData: any, session?: any) => {
  try {
    // Create profile
    const { profile, accountNumber } = await createUserProfile(userId, profileData);

    // Create checking and savings accounts
    const { checkingAccountNumber, savingsAccountNumber } = await createUserAccounts(userId, accountNumber, session);

    // Assign user role
    const role = await assignUserRole(userId, 'user');

    return { 
      profile, 
      role, 
      accountNumber: checkingAccountNumber, // Primary account number (for email)
      savingsAccountNumber 
    };
  } catch (error) {
    throw error;
  }
};