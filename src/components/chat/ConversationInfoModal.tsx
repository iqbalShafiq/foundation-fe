import React, { useState, useEffect } from 'react';
import { Info, Copy, Check, List } from 'lucide-react';
import { Modal } from '../ui';
import { Conversation, ConversationDetail } from '../../types/chat';
import { apiService } from '../../services/api';
import ModelsModal from './ModelsModal';

interface ConversationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

const ConversationInfoModal: React.FC<ConversationInfoModalProps> = ({
  isOpen,
  onClose,
  conversation
}) => {
  const [copied, setCopied] = useState(false);
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);

  // Fetch conversation details when modal opens
  useEffect(() => {
    if (isOpen && conversation && !conversationDetail) {
      setLoadingDetails(true);
      apiService.getConversationDetail(conversation.id)
        .then(setConversationDetail)
        .catch(console.error)
        .finally(() => setLoadingDetails(false));
    }
  }, [isOpen, conversation, conversationDetail]);

  // Reset conversation detail when modal closes or conversation changes
  useEffect(() => {
    if (!isOpen) {
      setConversationDetail(null);
    }
  }, [isOpen]);

  // Calculate total tokens from all messages
  const calculateTotalTokens = () => {
    if (!conversationDetail) return null;
    
    return conversationDetail.messages.reduce((total, message) => {
      const messageTokens = (message.input_tokens || 0) + (message.output_tokens || 0);
      return total + messageTokens;
    }, 0);
  };

  if (!conversation) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(conversation.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conversation Information">
      <div className="space-y-6">
        {/* Title Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Title</h4>
          <p className="text-gray-100 text-base leading-relaxed">{conversation.title}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Model Type */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{conversation.category_name ? 'Category' : 'Model'}</h4>
              <div>
                <p className="text-gray-100">{conversation.category_name || conversation.model_type}</p>
                <p className="text-gray-400 text-sm">{conversation.category_name ? 'Chat Category' : 'AI Assistant'}</p>
              </div>
            </div>

            {/* Message Count */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Messages</h4>
              <p className="text-gray-100">
                {conversation.message_count || 0} message{(conversation.message_count || 0) !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Total Tokens */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Total Tokens</h4>
              {loadingDetails ? (
                <p className="text-gray-400">Loading...</p>
              ) : (
                <p className="text-gray-100">
                  {(() => {
                    const totalTokens = calculateTotalTokens();
                    return totalTokens !== null 
                      ? `${totalTokens.toLocaleString()} tokens`
                      : 'N/A';
                  })()}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Created Date */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Created</h4>
              <div>
                <p className="text-gray-100">{formatRelativeDate(conversation.created_at)}</p>
                <p className="text-gray-400 text-sm">{formatDate(conversation.created_at)}</p>
              </div>
            </div>

            {/* Last Updated */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Last Updated</h4>
              <div>
                <p className="text-gray-100">{formatRelativeDate(conversation.updated_at)}</p>
                <p className="text-gray-400 text-sm">{formatDate(conversation.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Conversation ID */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Conversation ID</h4>
          </div>
          <div className="flex items-center space-x-2 group">
            <p className="text-gray-100 font-mono text-sm break-all flex-1">{conversation.id}</p>
            <button
              onClick={handleCopyId}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-600 transition-colors duration-200"
              title="Copy conversation ID"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400 hover:text-gray-200" />
              )}
            </button>
          </div>
        </div>

        {/* View Models Button */}
        <div className="pt-4 border-t border-gray-600">
          <button
            onClick={() => setIsModelsModalOpen(true)}
            className="flex items-center space-x-2 w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
          >
            <List className="h-4 w-4" />
            <span>View All Available Models</span>
          </button>
        </div>
      </div>

      {/* Models Modal */}
      <ModelsModal
        isOpen={isModelsModalOpen}
        onClose={() => setIsModelsModalOpen(false)}
      />
    </Modal>
  );
};

export default ConversationInfoModal;