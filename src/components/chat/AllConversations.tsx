import React, { useEffect, useState } from 'react';
import { MessageCircle, Clock, Bot, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { Conversation } from '../../types/chat';
import { Card, Button } from '../ui';

interface AllConversationsProps {
  onSelectConversation: (conversationId: string) => void;
}

const AllConversations: React.FC<AllConversationsProps> = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const limit = 12; // Show 12 conversations per page for grid layout

  useEffect(() => {
    loadConversations();
  }, [currentPage]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getConversationsPaginated(currentPage, limit);
      setConversations(response.data);
      setTotalPages(response.pagination.total_pages);
      setTotalCount(response.pagination.total_count);
      setHasNext(response.pagination.has_next);
      setHasPrev(response.pagination.has_prev);
      setError('');
    } catch (err: any) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const conversationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (conversationDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (conversationDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getModelIcon = (modelType: string) => {
    return <Bot className="w-4 h-4 text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-red-400 mb-2">Error loading conversations</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-6 py-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">All Conversations</h1>
          </div>
          <p className="text-gray-400">
            {totalCount} conversation{totalCount !== 1 ? 's' : ''} total
            {totalPages > 1 && (
              <span className="ml-2">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Content - takes remaining space between header and footer */}
      <div className="flex-1 flex items-center px-4 py-6">
        <div className="w-full max-w-6xl mx-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">No conversations yet</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Start a new conversation to see it appear here. All your chat history will be organized and easily accessible.
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-all duration-200 hover:border-gray-500 cursor-pointer"
                  padding="none"
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {getModelIcon(conversation.model_type)}
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                          {conversation.model_type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-400 text-xs flex-shrink-0 ml-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(conversation.updated_at)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-gray-100 font-medium mb-3 leading-5 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.5rem', // Force 2 lines height (2 * line-height + small buffer)
                      height: '2.5rem'
                    }}>
                      {conversation.title}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center text-xs text-gray-400">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      <span>{conversation.message_count || 0} message{(conversation.message_count || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination Footer - Always at bottom */}
      {totalPages > 1 && (
        <div className="px-4 py-6 flex-shrink-0 flex items-center justify-center">
          <div className="max-w-6xl mx-auto flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!hasPrev || loading}
              icon={ChevronLeft}
              iconPosition="left"
              className={`transition-all duration-200 ${
                !hasPrev || loading 
                  ? 'opacity-40 cursor-not-allowed text-gray-500' 
                  : 'text-white hover:text-blue-400'
              }`}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-3">
              {/* Show page numbers around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white shadow-md transform scale-105'
                        : 'bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNext || loading}
              icon={ChevronRight}
              iconPosition="right"
              className={`transition-all duration-200 ${
                !hasNext || loading 
                  ? 'opacity-40 cursor-not-allowed text-gray-500' 
                  : 'text-white hover:text-blue-400'
              }`}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllConversations;