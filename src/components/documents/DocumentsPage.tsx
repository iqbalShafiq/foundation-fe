import React, { useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { Button } from '../ui';
import { DocumentManager } from './DocumentManager';
import { CollectionManager } from './CollectionManager';

export const DocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'collections'>('documents');

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Documents</h1>
          <p className="text-gray-400">
            Manage your documents and collections for AI-powered conversations
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8">
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

        {/* Content */}
        {activeTab === 'documents' ? (
          <DocumentManager />
        ) : (
          <CollectionManager />
        )}
      </div>
    </div>
  );
};