import React, { useEffect, useState } from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen, Image, Search, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { Conversation } from '../../types/chat';
import UserProfile from './UserProfile';
import SidebarButton from './SidebarButton';
import SearchModal from './SearchModal';
import GalleryModal from './GalleryModal';

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadConversations();
    }
  }, [refreshTrigger]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getConversations();
      setConversations(data);
      setError('');
    } catch (err: any) {
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
            onClick={() => setIsCollapsed(!isCollapsed)}
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
      <div className={`px-2 space-y-0.5 ${isCollapsed ? 'pt-3' : 'pb-6'} transition-all duration-300`}>
        <SidebarButton
          icon={Plus}
          label="New chat"
          onClick={onNewConversation}
          collapsed={isCollapsed}
        />
        <SidebarButton
          icon={Search}
          label="Search Chats"
          onClick={() => setIsSearchModalOpen(true)}
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
          onClick={onShowAllConversations}
          isActive={currentView === 'all-conversations'}
          collapsed={isCollapsed}
        />
      </div>

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
              <div>
                {/* Conversations Label */}
                <div className="px-4 pb-2">
                  <h3 className={`text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
                  }`}>
                    Conversations
                  </h3>
                </div>
                
                {/* Conversations List - This is the scrollable area */}
                <div className="px-2 space-y-1 pb-4">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`group w-full text-left px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-800 ${
                        currentConversationId === conversation.id
                          ? 'bg-gray-800 border-l-2 border-blue-500'
                          : ''
                      }`}
                      title={`${conversation.title} (${conversation.model_type})`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium text-gray-200 truncate flex-1 whitespace-nowrap transition-opacity duration-300 ${
                          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
                        }`}>
                          {truncateTitle(conversation.title)}
                        </p>
                        {/* Model shown on hover */}
                        <span className={`opacity-0 group-hover:opacity-100 text-xs text-gray-400 ml-2 transition-opacity duration-200 flex-shrink-0 whitespace-nowrap ${
                          isCollapsed ? 'opacity-0 pointer-events-none' : ''
                        }`}>
                          {conversation.model_type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
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
    </div>
  );
};

export default ConversationSidebar;