/**
 * Error handler utility for suppressing Supabase error popups
 * Logs errors to console instead of showing toast notifications
 */

import { toast } from 'sonner';

/**
 * Handle Supabase errors by logging to console instead of showing toast
 * Use this for database-related errors that shouldn't popup to users
 */
export const handleSupabaseError = (error: any, context?: string) => {
  const errorMessage = error?.message || 'Unknown error occurred';
  const contextInfo = context ? `[${context}] ` : '';
  
  // Log to console instead of showing popup
  console.error(`${contextInfo}Supabase Error:`, {
    message: errorMessage,
    error: error,
    timestamp: new Date().toISOString()
  });
  
  // Return false to indicate error was handled silently
  return false;
};

/**
 * Handle user-facing errors with toast notifications
 * Use this for errors that should be shown to users
 */
export const handleUserError = (message: string, error?: any) => {
  console.error('User Error:', { message, error });
  toast.error(message);
};

/**
 * Handle success messages
 */
export const handleSuccess = (message: string) => {
  toast.success(message);
};

/**
 * Check if error is a Supabase table/schema error that should be suppressed
 */
export const isSupabaseTableError = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('could not find the table') ||
    errorMessage.includes('in the schema cache') ||
    errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
    errorMessage.includes('table') && errorMessage.includes('not found')
  );
};

/**
 * Handle errors with smart filtering - suppress table errors, show others
 */
export const handleSmartError = (error: any, context?: string, userMessage?: string) => {
  // If it's a table/schema error, suppress it
  if (isSupabaseTableError(error)) {
    return handleSupabaseError(error, context);
  }
  
  // For other errors, show user-friendly message
  const message = userMessage || error?.message || 'An error occurred';
  handleUserError(message, error);
  return true;
};