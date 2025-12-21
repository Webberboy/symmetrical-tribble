/**
 * Authentication utility functions for consistent session validation
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates the current Supabase session and optionally redirects on failure
 * @param redirectOnFailure - Whether to redirect to auth page if session is invalid
 * @param navigate - Optional navigate function for redirection
 * @returns Promise<boolean> - True if session is valid, false otherwise
 */
export const validateSession = async (
  redirectOnFailure: boolean = false, 
  navigate?: (path: string) => void
): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      // Session is invalid or expired
      if (redirectOnFailure && navigate) {
        localStorage.removeItem("user");
        navigate("/auth");
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error validating session:", error);
    if (redirectOnFailure && navigate) {
      localStorage.removeItem("user");
      navigate("/auth");
    }
    return false;
  }
};

/**
 * Gets the current authenticated user
 * @param redirectOnFailure - Whether to redirect to auth page if user is not authenticated
 * @param navigate - Optional navigate function for redirection
 * @returns Promise<User | null> - The authenticated user or null
 */
export const getAuthenticatedUser = async (
  redirectOnFailure: boolean = false, 
  navigate?: (path: string) => void
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      if (redirectOnFailure && navigate) {
        localStorage.removeItem("user");
        navigate("/auth");
      }
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    if (redirectOnFailure && navigate) {
      localStorage.removeItem("user");
      navigate("/auth");
    }
    return null;
  }
};

/**
 * Clears all authentication data and redirects to signin
 * @param navigate - Optional navigate function for redirection
 */
export const clearAuthAndRedirect = (navigate?: (path: string) => void) => {
  localStorage.removeItem("user");
  if (navigate) {
    navigate("/auth");
  }
};