import React, { useState, useEffect } from 'react';
import { Modal } from '../ui';
import { Button } from '../ui';
import { FeedbackType } from '../../types/chat';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackType: FeedbackType, description?: string) => void;
  initialFeedbackType?: FeedbackType;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialFeedbackType 
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialFeedbackType || 'like');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update feedback type when modal opens with new initial type
  useEffect(() => {
    if (isOpen && initialFeedbackType) {
      setFeedbackType(initialFeedbackType);
    }
  }, [isOpen, initialFeedbackType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(feedbackType, description.trim() || undefined);
      onClose();
      setDescription('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Provide Feedback">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-3">
            How would you rate this response?
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setFeedbackType('like')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                feedbackType === 'like'
                  ? 'bg-green-900/30 border-green-600 text-green-400'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ThumbsUp className="h-5 w-5" />
              <span>Helpful</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType('dislike')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                feedbackType === 'dislike'
                  ? 'bg-red-900/30 border-red-600 text-red-400'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ThumbsDown className="h-5 w-5" />
              <span>Not Helpful</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="feedback-description" className="block text-sm font-medium text-gray-200 mb-2">
            Additional comments (optional)
          </label>
          <textarea
            id="feedback-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Tell us more about what you ${feedbackType === 'like' ? 'liked' : 'didn\'t like'} about this response...`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
            rows={4}
          />
        </div>

        <div className="flex space-x-3">
          <Button 
            type="submit" 
            variant="primary" 
            loading={isSubmitting}
            className="flex-1"
          >
            Submit Feedback
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;