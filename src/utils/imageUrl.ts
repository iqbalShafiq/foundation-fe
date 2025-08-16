const API_BASE_URL = 'http://localhost:8000';

// Helper function to get full image URL
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return '';
  }
  
  if (imageUrl.startsWith('http')) {
    return imageUrl; // Already a full URL
  }
  
  const fullUrl = `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  return fullUrl;
};