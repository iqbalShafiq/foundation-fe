import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, FolderOpen } from 'lucide-react';
import { Button, Card, Input, Alert, Modal } from '../ui';
import { apiService } from '../../services/api';
import { DocumentCollection, Document } from '../../types/document';

interface CollectionManagerProps {
  className?: string;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({
  className = '',
}) => {
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<DocumentCollection | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load documents first
      const documentsData = await apiService.getDocuments();
      setDocuments(documentsData.filter(doc => doc.processing_status === 'completed'));
      
      // Try to load collections (may not be implemented yet)
      try {
        const collectionsData = await apiService.getCollections();
        setCollections(collectionsData);
      } catch (collectionsError) {
        console.warn('Collections API not available:', collectionsError);
        setCollections([]);
        setError('Collections feature is not yet available');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      await apiService.deleteCollection(collectionId);
      setCollections(collections.filter(c => c.id !== collectionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Document Collections</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          icon={Plus}
          iconPosition="left"
        >
          Create Collection
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Collections List */}
      {collections.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No collections yet</h3>
          <p className="text-gray-500">Create your first collection to organize documents</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <Card key={collection.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-gray-400 mb-3">{collection.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{collection.document_ids.length} documents</span>
                    </span>
                    <span>
                      Created {new Date(collection.created_at + 'Z').toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => setEditingCollection(collection)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(collection.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Collection Modal */}
      <CollectionModal
        isOpen={showCreateModal || !!editingCollection}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCollection(null);
        }}
        collection={editingCollection}
        documents={documents}
        onSuccess={(collection) => {
          if (editingCollection) {
            setCollections(collections.map(c => c.id === collection.id ? collection : c));
          } else {
            setCollections([...collections, collection]);
          }
          setShowCreateModal(false);
          setEditingCollection(null);
        }}
      />
    </div>
  );
};

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: DocumentCollection | null;
  documents: Document[];
  onSuccess: (collection: DocumentCollection) => void;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  collection,
  documents,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (collection) {
        setName(collection.name);
        setDescription(collection.description || '');
        setSelectedDocuments(collection.document_ids);
      } else {
        setName('');
        setDescription('');
        setSelectedDocuments([]);
      }
      setError(null);
    }
  }, [isOpen, collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);

      let result: DocumentCollection;
      if (collection) {
        result = await apiService.updateCollection(collection.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          document_ids: selectedDocuments,
        });
      } else {
        result = await apiService.createCollection(
          name.trim(),
          description.trim() || undefined,
          selectedDocuments
        );
      }

      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  const toggleDocument = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
    } else {
      setSelectedDocuments([...selectedDocuments, documentId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={collection ? 'Edit Collection' : 'Create Collection'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            label="Collection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter collection name"
            required
          />

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter collection description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-3">
            Select Documents ({selectedDocuments.length} selected)
          </label>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No documents available</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-600 rounded-lg p-3">
              {documents.map((document) => (
                <label
                  key={document.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={() => toggleDocument(document.id)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">
                      {document.original_filename}
                    </div>
                    <div className="text-xs text-gray-500">
                      {document.file_type.toUpperCase()} • {document.chunk_count} chunks
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <Button onClick={onClose} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            {collection ? 'Update' : 'Create'} Collection
          </Button>
        </div>
      </form>
    </Modal>
  );
};