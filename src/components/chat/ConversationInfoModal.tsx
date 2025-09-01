import React, { useState } from 'react';
import { Info, User as UserIcon, Copy, Check } from 'lucide-react';
import { Modal } from '../ui';
import { Conversation } from '../../types/chat';

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
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Model</h4>
              <div>
                <p className="text-gray-100">{conversation.model_type}</p>
                <p className="text-gray-400 text-sm">AI Assistant</p>
              </div>
            </div>

            {/* Message Count */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Messages</h4>
              <p className="text-gray-100">
                {conversation.message_count || 0} message{(conversation.message_count || 0) !== 1 ? 's' : ''}
              </p>
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

        {/* User ID (if available) */}
        {conversation.user_id && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <UserIcon className="h-4 w-4 text-indigo-400" />
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">User ID</h4>
            </div>
            <p className="text-gray-100 font-mono text-sm">{conversation.user_id}</p>
          </div>
        )}

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
      </div>
    </Modal>
  );
};

export default ConversationInfoModal;