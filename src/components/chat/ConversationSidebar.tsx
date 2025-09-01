import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, PanelLeftClose, PanelLeftOpen, Image, Search, MessageCircle, FileText, MoreVertical, Info, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { Conversation, ConversationDetail } from '../../types/chat';
import { getSidebarCollapsedState, setSidebarCollapsedState } from '../../utils/sidebarStorage';
import UserProfile from './UserProfile';
import SidebarButton from './SidebarButton';
import SearchModal from './SearchModal';
import GalleryModal from './GalleryModal';
import ConversationInfoModal from './ConversationInfoModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Dropdown } from '../ui';

interface ConversationSidebarProps {
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onShowAllConversations: () => void;
  refreshTrigger?: number;
  currentView?: 'chat' | 'all-conversations';
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onShowAllConversations,
  refreshTrigger,
  currentView = 'chat'
}) => {
  // Mark unused props to avoid linting errors
  void onNewConversation;
  void onShowAllConversations;
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentConversationDetail, setCurrentConversationDetail] = useState<ConversationDetail | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => getSidebarCollapsedState());
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on the three-dot button or expanded content
      if (target.closest('[data-conversation-menu]')) {
        return;
      }
      // Don't close the current conversation menu
      if (openDropdownId && openDropdownId !== currentConversationId) {
        setOpenDropdownId(currentConversationId || null);
      }
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
  }, [openDropdownId, currentConversationId]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadConversations();
    }
  }, [refreshTrigger]);

  // Auto-expand current conversation menu
  useEffect(() => {
    if (currentConversationId) {
      setOpenDropdownId(currentConversationId);
    }
  }, [currentConversationId]);

  // Fetch current conversation detail for token display
  useEffect(() => {
    const fetchCurrentConversationDetail = async () => {
      if (currentConversationId) {
        try {
          const detail = await apiService.getConversationDetail(currentConversationId);
          setCurrentConversationDetail(detail);
        } catch (err) {
          console.error('Error fetching conversation detail:', err);
          setCurrentConversationDetail(null);
        }
      } else {
        setCurrentConversationDetail(null);
      }
    };

    fetchCurrentConversationDetail();
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getConversations();
      setConversations(data);
      setError('');
    } catch (err: unknown) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const formatTokenCount = (tokens: number) => {
    if (tokens >= 1000000000) {
      return `${(tokens / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (tokens >= 10000) {
      return `${(tokens / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return tokens.toString();
  };

  const getCurrentConversationTotalTokens = () => {
    if (!currentConversationDetail) return null;
    
    // Find the last AI message (assistant role) - iterate from the end without modifying original array
    const messages = currentConversationDetail.messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.total_tokens) {
        return msg.total_tokens;
      }
    }
    
    return null;
  };


  const handleConfirmDelete = async () => {
    if (!selectedConversation) return;

    try {
      setIsDeleting(true);
      await apiService.deleteConversation(selectedConversation.id);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      
      // Navigate away if we're currently viewing the deleted conversation
      if (currentConversationId === selectedConversation.id) {
        navigate('/');
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



  if (loading) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gray-900 border-r border-gray-700 flex items-center justify-center transition-all duration-300`}>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }


  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gray-900 border-r border-gray-700 flex flex-col h-full transition-all duration-300`}>
      {/* Header */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 bg-gray-900 transition-all duration-300`}>
        <div className={`flex items-center h-8 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-100 whitespace-nowrap transition-opacity duration-300">
              Foundation Chat
            </h2>
          )}
          <button
            onClick={() => {
              const newCollapsedState = !isCollapsed;
              setIsCollapsed(newCollapsedState);
              setSidebarCollapsedState(newCollapsedState);
            }}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200 flex-shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Buttons - Fixed at top */}
      <div className={`space-y-0.5 ${isCollapsed ? 'pt-3 px-1' : 'pb-6 px-2'} transition-all duration-300`}>
        <SidebarButton
          icon={Bot}
          label="New chat"
          href="/"
          collapsed={isCollapsed}
          iconColor="blue"
        />
        <SidebarButton
          icon={Search}
          label="Search Chats"
          onClick={() => setIsSearchModalOpen(true)}
          collapsed={isCollapsed}
        />
        <SidebarButton
          icon={FileText}
          label="Documents"
          href="/documents"
          isActive={location.pathname === '/documents'}
          collapsed={isCollapsed}
        />
        <SidebarButton
          icon={Image}
          label="Gallery"
          onClick={() => setIsGalleryModalOpen(true)}
          collapsed={isCollapsed}
        />
        <SidebarButton
          icon={MessageCircle}
          label="All Conversations"
          href="/conversations"
          isActive={location.pathname === '/conversations'}
          collapsed={isCollapsed}
        />
      </div>

      {/* Conversations Label - Fixed */}
      {!isCollapsed && currentView !== 'all-conversations' && conversations.length > 0 && !loading && !error && (
        <div className="px-4 pb-2">
          <h3 className={`text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap transition-opacity duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
          }`}>
            Conversations
          </h3>
        </div>
      )}

      {/* Conversation History - Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Conversations List - only show when not collapsed and not in All Conversations view */}
        {!isCollapsed && currentView !== 'all-conversations' && (
          <>
            {error && (
              <div className="mx-4 mt-4 mb-4 p-3 text-red-400 text-sm bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}

            {conversations.length === 0 && !loading && !error ? (
              <div className="px-4 py-6 text-gray-400 text-center">
                <p className={`text-sm whitespace-nowrap transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
                }`}>No conversations yet</p>
                <p className={`text-xs text-gray-500 mt-1 whitespace-nowrap transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
                }`}>Start a new chat to begin</p>
              </div>
            ) : (
              /* Conversations List - This is the scrollable area */
              <div className="px-2 space-y-1 pb-4">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group w-full text-left rounded-lg transition-all duration-400 ease-in-out ${
                      currentConversationId === conversation.id
                        ? 'bg-gray-800 border-l-2 border-blue-500 shadow-lg transform scale-[1.02]'
                        : ''
                    } ${openDropdownId === conversation.id && currentConversationId !== conversation.id ? 'bg-gray-800 shadow-lg transform scale-[1.02]' : ''} ${currentConversationId !== conversation.id ? 'hover:bg-gray-800 hover:shadow-md' : ''}`}
                    data-conversation-menu
                  >
                    {/* Main conversation row */}
                    <div className="relative flex items-center justify-between">
                      <Link
                        to={`/conversation/${conversation.id}`}
                        className="flex-1 min-w-0 px-3 py-2 cursor-pointer"
                        title={`${conversation.title} (${conversation.model_type})`}
                      >
                        <p className={`text-sm font-medium text-gray-200 truncate transition-opacity duration-300 ${
                          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
                        }`}>
                          {truncateTitle(conversation.title)}
                        </p>
                      </Link>
                      
                      {/* Three-dot menu button - hidden for current conversation */}
                      {!isCollapsed && currentConversationId !== conversation.id && (
                        <button
                          className="p-1 mr-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === conversation.id ? null : conversation.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Expanded menu section - always expanded for current conversation */}
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openDropdownId === conversation.id || currentConversationId === conversation.id
                        ? 'max-h-32 opacity-100 transform translate-y-0' 
                        : 'max-h-0 opacity-0 transform -translate-y-2'
                    }`}>
                      <div className={`px-3 pb-3 space-y-2 transition-all duration-300 delay-75 ${
                        openDropdownId === conversation.id || currentConversationId === conversation.id
                          ? 'opacity-100 transform translate-y-0' 
                          : 'opacity-0 transform -translate-y-1'
                      }`}>
                        {/* Model info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-700/50 rounded-md px-2 py-1 transition-all duration-200 hover:bg-gray-700/70 flex-1">
                            <Bot className="h-3 w-3 text-blue-400" />
                            <span>Model: {conversation.model_type}</span>
                          </div>
                          {currentConversationId === conversation.id && (
                            <div className="ml-2 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-md border border-blue-600/30">
                              {(() => {
                                const totalTokens = getCurrentConversationTotalTokens();
                                return totalTokens 
                                  ? `${formatTokenCount(totalTokens)} tokens`
                                  : 'Current';
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedConversation(conversation);
                            setIsDeleteModalOpen(true);
                            setOpenDropdownId(null);
                          }}
                          className="flex items-center space-x-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md px-2 py-1 w-full text-left transition-all duration-200 hover:transform hover:scale-105"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete Conversation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* User Profile at Bottom */}
      <div className="border-t border-gray-700 bg-gray-900 px-4 py-4">
        <UserProfile collapsed={isCollapsed} />
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectConversation={onSelectConversation}
      />

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectConversation={onSelectConversation}
      />

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

export default ConversationSidebar;