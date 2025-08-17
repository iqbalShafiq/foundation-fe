const API_BASE_URL = 'http://localhost:8000';

/**
 * Get the full URL for accessing/downloading a document
 * @param document_url - The relative document URL from the API (e.g., "/documents/doc-123/download")
 * @returns Full URL to access the document
 */
export const getDocumentUrl = (document_url?: string | null): string | null => {
  if (!document_url) return null;
  
  // If already a full URL, return as is
  if (document_url.startsWith('http://') || document_url.startsWith('https://')) {
    return document_url;
  }
  
  // Combine with base URL
  return `${API_BASE_URL}${document_url}`;
};

/**
 * Check if a document can be viewed in the browser (vs download only)
 * @param file_type - The file type (e.g., "pdf", "docx", "txt")
 * @returns true if can be viewed in browser, false if should be downloaded
 */
export const canViewInBrowser = (file_type: string): boolean => {
  const viewableTypes = ['pdf', 'txt', 'text'];
  return viewableTypes.includes(file_type.toLowerCase());
};

/**
 * Ensure filename has the correct file extension
 * @param filename - Original filename
 * @param file_type - File type from backend
 * @returns Filename with proper extension
 */
const ensureFileExtension = (filename: string, file_type?: string): string => {
  if (!file_type) return filename;
  
  const extension = `.${file_type.toLowerCase()}`;
  
  // If filename already has the correct extension, return as is
  if (filename.toLowerCase().endsWith(extension)) {
    return filename;
  }
  
  // If filename has a different extension, replace it
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    const currentExtension = filename.substring(lastDotIndex);
    // Only replace if it looks like a file extension (3-4 chars after dot)
    if (currentExtension.length <= 5) {
      return filename.substring(0, lastDotIndex) + extension;
    }
  }
  
  // If no extension, add it
  return filename + extension;
};

/**
 * Open document in new tab (for viewing) or trigger download
 * @param document_url - The relative document URL from the API
 * @param file_type - The file type
 * @param original_filename - Original filename for fallback
 */
export const openDocument = async (
  document_url?: string | null, 
  file_type?: string, 
  original_filename?: string
): Promise<void> => {
  const fullUrl = getDocumentUrl(document_url);
  if (!fullUrl) {
    console.error('No document URL available');
    return;
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('No authentication token available');
    return;
  }

  try {
    // Use fetch with authentication headers
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (file_type && canViewInBrowser(file_type)) {
      // Open in new tab for viewing
      window.open(blobUrl, '_blank');
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } else {
      // Create temporary link for download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = ensureFileExtension(original_filename || 'document', file_type);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Error opening document:', error);
    
    if (error instanceof Error) {
      alert(`Failed to open document: ${error.message}`);
    } else {
      alert('Failed to open document. Please try again.');
    }
  }
};