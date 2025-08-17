import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, ChevronDown, Image as ImageIcon, X, FileText } from 'lucide-react';
import { ModelType } from '../../types/chat';
import { Modal } from '../ui';
import ModelSelector from './ModelSelector';
import { DocumentSelector } from './DocumentSelector';

interface ChatInputProps {
  onSendMessage: (message: string, images?: File[], documentContexts?: string[], contextCollection?: string) => void;
  disabled?: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  disableModelSelection?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ 
  onSendMessage, 
  disabled = false, 
  selectedModel, 
  onModelChange,
  disableModelSelection = false
}, ref) => {
  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  // Focus on mount with a small delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(
        message, 
        selectedImages.length > 0 ? selectedImages : undefined,
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
        selectedCollection
      );
      setMessage('');
      setSelectedImages([]);
      // Keep document selection for follow-up questions
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Focus back to input after sending message with a small delay
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Submit with Enter only
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setSelectedImages(prev => [...prev, ...imageFiles]);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="bg-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="w-full ml-[-5px]">
            <div className="bg-gray-700 border border-gray-600 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
            
            {/* Image Preview Section */}
            {selectedImages.length > 0 && (
              <div className="px-4 pt-4">
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Selected ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              disabled={disabled}
              className="w-full px-4 py-3 bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none resize-none min-h-[48px] max-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed scrollbar-hide"
              rows={1}
            />
            
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center space-x-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={disabled}
                  className="w-8 h-8 flex items-center justify-center bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  title="Add images"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>

                {/* Document Context Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDocumentModalOpen(true)}
                    disabled={disabled}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                      selectedDocuments.length > 0 || selectedCollection
                        ? 'bg-blue-600/50 text-blue-300 hover:bg-blue-600/70'
                        : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600/70'
                    }`}
                    title={
                      selectedCollection 
                        ? `Using collection context`
                        : selectedDocuments.length > 0 
                          ? `${selectedDocuments.length} document${selectedDocuments.length !== 1 ? 's' : ''} selected`
                          : 'Add document context'
                    }
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                  {(selectedDocuments.length > 0 || selectedCollection) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                      {selectedCollection ? '!' : selectedDocuments.length}
                    </span>
                  )}
                </div>
                
                {/* Model Selector Button */}
                <button
                  type="button"
                  onClick={() => !disableModelSelection && setIsModelModalOpen(true)}
                  disabled={disableModelSelection}
                  className={`bg-gray-600/50 text-gray-300 text-sm px-3 py-1 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-2 ${
                    disableModelSelection 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-600/70 cursor-pointer'
                  }`}
                  title={disableModelSelection 
                    ? `Model locked to ${selectedModel} for this conversation` 
                    : `Select AI model`
                  }
                >
                  <span>{selectedModel}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!message.trim() || disabled}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />

      <Modal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        title="Select AI Model"
        size="md"
      >
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          onClose={() => setIsModelModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        title="Document Context"
        size="lg"
      >
        <DocumentSelector
          selectedDocuments={selectedDocuments}
          selectedCollection={selectedCollection}
          onDocumentsChange={setSelectedDocuments}
          onCollectionChange={setSelectedCollection}
          onClose={() => setIsDocumentModalOpen(false)}
        />
      </Modal>
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;