import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MessageCircle, Calendar, ExternalLink } from 'lucide-react';
import { apiService } from '../../services/api';
import { GalleryResponse, ImageItem } from '../../types/gallery';
import { getImageUrl } from '../../utils/imageUrl';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conversationId: string) => void;
}

const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation
}) => {
  const [gallery, setGallery] = useState<GalleryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGallery(1);
    }
  }, [isOpen]);

  const loadGallery = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getMyGallery(page, 2); // 2 images per page for testing pagination
      setGallery(data);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load gallery');
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (gallery?.pagination.has_prev) {
      loadGallery(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (gallery?.pagination.has_next) {
      loadGallery(currentPage + 1);
    }
  };

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image);
  };

  const handleGoToConversation = (conversationId: string) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 transition-opacity flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700 overflow-hidden shadow-xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Gallery</h2>
            <p className="text-gray-400 text-sm mt-1">
              Your uploaded images from conversations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-2 hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Gallery */}
          <div className="flex-1 p-6 overflow-y-auto relative">
            {error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-400 text-center">
                  <p>{error}</p>
                  <button
                    onClick={() => loadGallery(currentPage)}
                    className="mt-2 text-blue-400 hover:text-blue-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : gallery && gallery.data.length > 0 ? (
              <>
                {/* Images Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 relative">
                  {/* Loading Overlay */}
                  {loading && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
                      <div className="text-gray-300 flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                        <span>Loading...</span>
                      </div>
                    </div>
                  )}
                  {gallery.data.map((image, index) => {
                  const imageUrl = getImageUrl(image.url);
                  
                  return (
                    <div
                      key={`${image.message_id}-${index}`}
                      className="relative group cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    >
                      <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative">
                        {/* Loading skeleton */}
                        <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                          <div className="text-gray-500 text-sm">Loading...</div>
                        </div>
                        
                        <img
                          src={imageUrl}
                          alt={`Image from message ${image.message_id}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 relative z-10"
                          onLoad={(e) => {
                            console.log('✅ Image loaded:', imageUrl);
                            // Hide loading skeleton
                            const loadingDiv = e.currentTarget.previousElementSibling as HTMLElement;
                            if (loadingDiv) loadingDiv.style.display = 'none';
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', imageUrl);
                            // Hide loading skeleton and show error
                            const loadingDiv = e.currentTarget.previousElementSibling as HTMLElement;
                            if (loadingDiv) loadingDiv.style.display = 'none';
                            
                            e.currentTarget.style.display = 'none';
                            const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                            if (errorDiv) errorDiv.style.display = 'flex';
                          }}
                        />
                        
                        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-sm hidden z-20">
                          <div className="text-center">
                            <div className="text-red-400 mb-1">❌</div>
                            <div>Failed to load</div>
                            <div className="text-xs mt-1 text-gray-500 break-all px-2">{imageUrl}</div>
                          </div>
                        </div>
                      </div>
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>


              </>
            ) : loading && !gallery ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-300 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                  <span>Loading gallery...</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 text-center">
                  <p>No images found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload images in your conversations to see them here
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Image Detail Sidebar */}
          {selectedImage && (
            <div className="w-80 bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Large Image Preview */}
                <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(selectedImage.url)}
                    alt={`Image from message ${selectedImage.message_id}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Details */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">Image Details</h3>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedImage.created_at)}</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Message Content
                    </label>
                    <p className="text-sm text-gray-200 mt-1 bg-gray-800 p-3 rounded-lg">
                      {selectedImage.message_content}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleGoToConversation(selectedImage.conversation_id)}
                      className="flex items-center space-x-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Go to Conversation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Pagination Footer */}
        {gallery && gallery.pagination.total_pages > 1 && (
          <div className="border-t border-gray-700 bg-gray-800 px-6 py-4 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {gallery.pagination.page} of {gallery.pagination.total_pages} 
                ({gallery.pagination.total_count} images total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={loading || !gallery.pagination.has_prev}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={loading || !gallery.pagination.has_next}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryModal;