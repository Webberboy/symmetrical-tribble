import { supabase } from "@/integrations/supabase/client";

/**
 * Convert file to base64 and store ID document data in database
 * @param file - The file to convert and store
 * @param userId - The user ID to update in profiles table
 * @returns Promise<{success: boolean, error: string | null}>
 */
export const storeIdDocument = async (file: File, userId: string): Promise<{success: boolean, error: string | null}> => {
  try {

    // Validate file size (limit to 5MB for database storage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Only PDF, JPEG, and PNG files are allowed' };
    }

    // Convert file to base64
    const base64Data = await convertFileToBase64(file);

    // Store in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        id_document_data: base64Data,
        id_document_filename: file.name,
        id_document_type: file.type
      })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };

  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

/**
 * Convert file to base64 string
 * @param file - The file to convert
 * @returns Promise<string> - Base64 encoded string
 */
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Delete ID document from Supabase Storage
 * @param filePath - The file path in storage
 * @returns Promise<{success: boolean, error: string | null}>
 */
export const deleteIdDocument = async (filePath: string): Promise<{success: boolean, error: string | null}> => {
  try {
    const { error } = await supabase.storage
      .from('id-documents')
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Delete failed' };
  }
};

/**
 * Get signed URL for viewing ID document (for admin access)
 * @param filePath - The file path in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise<{url: string | null, error: string | null}>
 */
export const getIdDocumentSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<{url: string | null, error: string | null}> => {
  try {
    const { data, error } = await supabase.storage
      .from('id-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error.message || 'Failed to get signed URL' };
  }
};