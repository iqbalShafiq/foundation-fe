import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, Bot, ChevronLeft, ChevronRight, MoreVertical, Info, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { Conversation } from '../../types/chat';
import { Card, Button, Dropdown } from '../ui';
import ConversationInfoModal from './ConversationInfoModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface AllConversationsProps {
  onSelectConversation: (conversationId: string) => void;
}

const AllConversations: React.FC<AllConversationsProps> = ({ onSelectConversation }) => {
  void onSelectConversation; // Mark unused prop to avoid linting errors
  
  const navigate = useNavigate();
  void navigate; // Mark unused variable to avoid linting errors for now
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const limit = 12; // Show 12 conversations per page for grid layout

  useEffect(() => {
    loadConversations();
  }, [currentPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on the three-dot button or expanded content
      if (target.closest('[data-conversation-menu]')) {
        return;
      }
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      // Use a small delay to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const loadConversations = async () => {
    try {
      // Only show full loading on initial load, use pagination loading for page changes
      if (conversations.length === 0) {
        setLoading(true);
      } else {
        setPaginationLoading(true);
      }
      
      const response = await apiService.getConversationsPaginated(currentPage, limit);
      setConversations(response.data);
      setTotalPages(response.pagination.total_pages);
      setTotalCount(response.pagination.total_count);
      setHasNext(response.pagination.has_next);
      setHasPrev(response.pagination.has_prev);
      setError('');
    } catch (err: unknown) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
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
    void modelType; // Mark unused param to avoid linting errors
    return <Bot className="w-4 h-4 text-blue-400" />;
  };

  const handleConfirmDelete = async () => {
    if (!selectedConversation) return;

    try {
      setIsDeleting(true);
      await apiService.deleteConversation(selectedConversation.id);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      
      // Update total count
      setTotalCount(prev => prev - 1);
      
      // If this was the last item on the page and we're not on page 1, go back a page
      if (conversations.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        // Reload the conversations to refresh pagination
        await loadConversations();
      }
      
      setIsDeleteModalOpen(false);
      setSelectedConversation(null);
    } catch (err: unknown) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDropdownItems = (conversation: Conversation) => [
    {
      id: 'info',
      label: 'View Info',
      icon: Info,
      onClick: () => {
        setSelectedConversation(conversation);
        setIsInfoModalOpen(true);
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: () => {
        setSelectedConversation(conversation);
        setIsDeleteModalOpen(true);
      },
      variant: 'danger' as const
    }
  ];

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
    <div className="flex-1 bg-gray-800 flex flex-col relative">
      {/* Header - Fixed to prevent flicker */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-6 py-6 flex-shrink-0 transition-all duration-200 ease-in-out">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">All Conversations</h1>
          </div>
          <p className="text-gray-400 transition-all duration-200">
            {totalCount} conversation{totalCount !== 1 ? 's' : ''} total
            {totalPages > 1 && (
              <span className="ml-2">
                • Page {currentPage} of {totalPages}
                {paginationLoading && (
                  <span className="ml-2 text-blue-400">
                    <span className="animate-pulse">Loading...</span>
                  </span>
                )}
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
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 ${paginationLoading ? 'opacity-60' : 'opacity-100'}`}>
              {conversations.map((conversation) => (
                <div key={conversation.id} className="group" data-conversation-menu>
                  <Card 
                    className={`transition-all duration-400 ease-in-out cursor-pointer ${
                      openDropdownId === conversation.id 
                        ? 'bg-gray-600 border-gray-500 shadow-xl transform scale-[1.02]' 
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 hover:shadow-lg hover:transform hover:scale-[1.01]'
                    }`}
                    padding="none"
                  >
                    {/* Main card content */}
                    <div className="relative">
                      <Link
                        to={`/conversation/${conversation.id}`}
                        className="block p-4 pr-12"
                      >
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
                          minHeight: '2.5rem',
                          height: '2.5rem'
                        }}>
                          {conversation.title}
                        </h3>

                        {/* Stats */}
                        <div className="flex items-center text-xs text-gray-400">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          <span>{conversation.message_count || 0} message{(conversation.message_count || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </Link>
                      
                      {/* Three-dot menu button */}
                      <button
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === conversation.id ? null : conversation.id);
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Expanded menu section */}
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openDropdownId === conversation.id 
                        ? 'max-h-28 opacity-100' 
                        : 'max-h-0 opacity-0'
                    }`}>
                      <div className={`px-4 pb-4 pt-2 space-y-2 border-t border-gray-600 transition-all duration-300 ${
                        openDropdownId === conversation.id 
                          ? 'opacity-100 transform translate-y-0 delay-100' 
                          : 'opacity-0 transform -translate-y-2 delay-0'
                      }`}>
                        {/* Additional model info */}
                        <div className={`text-xs text-gray-400 transition-all duration-200 ${
                          openDropdownId === conversation.id ? 'delay-150' : ''
                        }`}>
                          <div className="flex items-center justify-between">
                            <span>Created: {new Date(conversation.created_at).toLocaleDateString()}</span>
                            <span>Updated: {formatDate(conversation.updated_at)}</span>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className={`flex space-x-2 transition-all duration-200 ${
                          openDropdownId === conversation.id ? 'delay-200' : ''
                        }`}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedConversation(conversation);
                              setIsInfoModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded px-2 py-1 transition-all duration-200 hover:transform hover:scale-105"
                          >
                            <Info className="h-3 w-3" />
                            <span>Details</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedConversation(conversation);
                              setIsDeleteModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded px-2 py-1 transition-all duration-200 hover:transform hover:scale-105"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
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
              disabled={!hasPrev || paginationLoading}
              icon={ChevronLeft}
              iconPosition="left"
              className={`transition-all duration-200 ${
                !hasPrev || paginationLoading 
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
                    disabled={paginationLoading}
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
              disabled={!hasNext || paginationLoading}
              icon={ChevronRight}
              iconPosition="right"
              className={`transition-all duration-200 ${
                !hasNext || paginationLoading 
                  ? 'opacity-40 cursor-not-allowed text-gray-500' 
                  : 'text-white hover:text-blue-400'
              }`}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Conversation Info Modal */}
      <ConversationInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setSelectedConversation(null);
        }}
        conversation={selectedConversation}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedConversation(null);
        }}
        onConfirm={handleConfirmDelete}
        conversation={selectedConversation}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AllConversations;