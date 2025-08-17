import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen } from 'lucide-react';
import { Button } from '../ui';
import { DocumentManager } from './DocumentManager';
import { CollectionManager } from './CollectionManager';
import ConversationSidebar from '../chat/ConversationSidebar';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'documents' | 'collections'>('documents');

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/conversation/${conversationId}`);
  };

  const handleNewConversation = () => {
    navigate('/');
  };

  const handleShowAllConversations = () => {
    navigate('/conversations');
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <ConversationSidebar
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onShowAllConversations={handleShowAllConversations}
        currentView="chat"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-6 py-6 flex-shrink-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-100">Documents</h1>
            </div>
            <p className="text-gray-400">
              Manage your documents and collections for AI-powered conversations
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="max-w-6xl mx-auto py-6">

            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              <Button
                onClick={() => setActiveTab('documents')}
                variant={activeTab === 'documents' ? 'primary' : 'ghost'}
                icon={FileText}
                iconPosition="left"
              >
                Documents
              </Button>
              <Button
                onClick={() => setActiveTab('collections')}
                variant={activeTab === 'collections' ? 'primary' : 'ghost'}
                icon={FolderOpen}
                iconPosition="left"
              >
                Collections
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'documents' ? (
              <DocumentManager />
            ) : (
              <CollectionManager />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};