import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { Button, Input } from '../ui';

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newContent: string) => Promise<void>;
  originalContent: string;
  isLoading?: boolean;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  originalContent,
  isLoading = false
}) => {
  const [content, setContent] = useState(originalContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(originalContent);
  }, [originalContent]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Select all text for easy editing
      textareaRef.current.select();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === originalContent.trim()) {
      onClose();
      return;
    }
    
    try {
      await onSubmit(content.trim());
      onClose();
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      data-modal="edit-message"
    >
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Edit Message</h2>
              <p className="text-sm text-gray-400">Make changes to your message and create a new branch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-700"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="message-content" className="block text-sm font-medium text-gray-200 mb-3">
              Message Content
            </label>
            <textarea
              ref={textareaRef}
              id="message-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[120px]"
              placeholder="Enter your message..."
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-2">
              Press <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">⌘ + Enter</kbd> or <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">Ctrl + Enter</kbd> to save
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div className="text-sm">
                <p className="text-blue-200 font-medium mb-1">About Message Editing</p>
                <p className="text-blue-300">
                  Editing this message will create a new conversation branch. The original message and subsequent responses will be preserved in the previous branch.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              iconPosition="left"
              loading={isLoading}
              disabled={!content.trim() || content.trim() === originalContent.trim()}
            >
              Save & Create Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMessageModal;