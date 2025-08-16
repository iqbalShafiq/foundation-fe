import React, { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Reset current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Check if this is the top-most modal
      const modals = document.querySelectorAll('[data-modal]');
      const thisModal = document.querySelector('[data-modal="image-viewer"]');
      
      switch (e.key) {
        case 'Escape':
          // Only close if this is the top-most modal
          if (thisModal && modals[modals.length - 1] === thisModal) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase for higher priority
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, currentIndex]);

  // Handle visibility transitions
  useEffect(() => {
    if (isOpen) {
      // Show component immediately, then trigger transition
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      // Hide component after transition completes
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    
    if (timeDiff < 500 && timeDiff > 50) { // More forgiving double-click timing
      // Double click detected
      if (zoom === 1) {
        // Zoom in to 2.5x at click position
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const newZoom = 2.5;
        setZoom(newZoom);
        setPosition({
          x: (centerX - clickX) * (newZoom - 1),
          y: (centerY - clickY) * (newZoom - 1)
        });
      } else {
        // Reset zoom with smooth transition
        resetZoom();
      }
    }
    
    setLastClickTime(now);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDoubleClick(e);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking on the overlay itself, not on any child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  if ((!isOpen && !isVisible) || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0, 0, 0, 0.75)' }}
      onClick={handleOverlayClick}
      data-modal="image-viewer"
    >

      {/* Main Image Container */}
      <div className="relative w-full h-full flex flex-col">
        {/* Top Controls */}
        <div 
          className={`absolute top-4 right-4 z-10 flex items-center space-x-2 transition-all duration-300 ease-out ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            disabled={zoom <= 0.5}
            className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="px-3 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg text-sm transition-all duration-200"
            title="Reset Zoom (Double-click image to zoom)"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            disabled={zoom >= 5}
            className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={currentIndex === 0}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
                isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}
              title="Previous Image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={currentIndex === images.length - 1}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
                isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}
              title="Next Image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Main Image */}
        <div 
          className={`flex-1 flex items-center justify-center p-4 overflow-hidden transition-all duration-300 ease-out ${
            isOpen ? 'scale-100' : 'scale-95'
          }`}
          onClick={handleOverlayClick}
        >
          <div 
            className={`relative ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleOverlayClick}
          >
            <img
              src={getImageUrl(currentImage)}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-[90vw] max-h-[80vh] object-contain select-none"
              draggable={false}
              onClick={handleImageClick}
            />
          </div>
        </div>

        {/* Bottom Thumbnail Gallery */}
        {images.length > 1 && (
          <div 
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 transition-all duration-300 ease-out ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center space-x-2 max-w-[90vw] overflow-x-auto scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`flex-shrink-0 relative overflow-hidden rounded-lg transition-all duration-200 ${
                      index === currentIndex
                        ? 'opacity-100'
                        : 'opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-16 h-16 object-cover transition-all duration-200 ${
                        index === currentIndex
                          ? 'brightness-110'
                          : 'brightness-75 hover:brightness-90'
                      }`}
                    />
                    {index === currentIndex && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div 
            className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-10 transition-all duration-300 ease-out ${
              isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;