import React, { useEffect, useState } from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen, Image, Search, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { Conversation } from '../../types/chat';
import UserProfile from './UserProfile';
import SidebarButton from './SidebarButton';
import SearchModal from './SearchModal';

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
      <div className="px-4 py-4 bg-gray-900">
        <div className="flex items-center justify-between h-8">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-100">
              Foundation Chat
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200"
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

      {/* Content Area - takes remaining space */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          /* Collapsed state - show all icons */
          <div className="px-2 pt-3 space-y-1">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center justify-center h-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full flex items-center justify-center h-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Search Chats"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => console.log('Gallery clicked')}
              className="w-full flex items-center justify-center h-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Gallery"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              onClick={onShowAllConversations}
              className={`w-full flex items-center justify-center h-8 hover:bg-gray-700 rounded-lg transition-all duration-200 ${
                currentView === 'all-conversations' 
                  ? 'text-blue-400 bg-blue-900/30' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="All Conversations"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Sidebar Buttons */}
            <div className="px-2 pb-6 space-y-0.5">
              <SidebarButton
                icon={Plus}
                label="New chat"
                onClick={onNewConversation}
              />
              <SidebarButton
                icon={Search}
                label="Search Chats"
                onClick={() => setIsSearchModalOpen(true)}
              />
              <SidebarButton
                icon={Image}
                label="Gallery"
                onClick={() => console.log('Gallery clicked')}
              />
              <SidebarButton
                icon={MessageCircle}
                label="All Conversations"
                onClick={onShowAllConversations}
                isActive={currentView === 'all-conversations'}
              />
            </div>

            {/* Conversations List - only show when not in All Conversations view */}
            {currentView !== 'all-conversations' && (
              <>
                {error && (
                  <div className="mx-4 mb-4 p-3 text-red-400 text-sm bg-red-900/20 rounded-lg">
                    {error}
                  </div>
                )}

                {conversations.length === 0 && !loading && !error ? (
                  <div className="px-4 text-gray-400 text-center">
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start a new chat to begin</p>
                  </div>
                ) : (
                  <div>
                    {/* Conversations Label */}
                    <div className="px-4 pb-2">
                      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Conversations
                      </h3>
                    </div>
                    
                    {/* Conversations List */}
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
                            <p className="text-sm font-medium text-gray-200 truncate flex-1">
                              {truncateTitle(conversation.title)}
                            </p>
                            {/* Model shown on hover */}
                            <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 ml-2 transition-opacity duration-200 flex-shrink-0">
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
    </div>
  );
};

export default ConversationSidebar;