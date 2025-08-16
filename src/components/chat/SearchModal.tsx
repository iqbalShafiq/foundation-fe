import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, MessageCircle, User, Bot } from 'lucide-react';
import { Modal, Input } from '../ui';
import { apiService } from '../../services/api';
import { Conversation } from '../../types/chat';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Debounced search function
  const debounceSearch = useCallback((term: string) => {
    const timeoutId = setTimeout(() => {
      if (term.trim()) {
        performSearch(term.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const cleanup = debounceSearch(searchTerm);
      return cleanup;
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, debounceSearch]);

  const performSearch = async (keyword: string) => {
    try {
      setLoading(true);
      setError('');
      const results = await apiService.searchConversations(keyword);
      setSearchResults(results);
    } catch (err: any) {
      setError('Failed to search conversations');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId);
    onClose();
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSearchResults([]);
    setError('');
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Search Conversations">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            icon={Search}
            iconPosition="left"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 text-red-400 text-sm bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Searching...</div>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchTerm && (
          <div className="max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No conversations found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try different keywords
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-all duration-200"
                  >
                    {/* Conversation Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-100 mb-1">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="px-2 py-1 bg-gray-600 rounded">
                            {conversation.model_type}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(conversation.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Related Chats */}
                    {conversation.related_chats && conversation.related_chats.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                          Matching Messages
                        </h4>
                        {conversation.related_chats.map((chat) => (
                          <div key={chat.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
                              {chat.role === 'user' ? (
                                <User className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Bot className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-300">
                                  {chat.role === 'user' ? 'You' : 'Assistant'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(chat.created_at))} ago
                                </span>
                              </div>
                              <p className="text-sm text-gray-200 leading-relaxed">
                                {truncateContent(chat.content)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!searchTerm && (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>Start typing to search conversations</p>
            <p className="text-sm text-gray-500 mt-1">
              Search through conversation titles and messages
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SearchModal;