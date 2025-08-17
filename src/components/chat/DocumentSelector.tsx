import React, { useState, useEffect, useRef } from 'react';
import { FileText, Check, X, Search, Eye, Download, ExternalLink, Upload, Loader } from 'lucide-react';
import { Button, Input } from '../ui';
import { apiService } from '../../services/api';
import { Document, DocumentCollection } from '../../types/document';
import { openDocument, canViewInBrowser } from '../../utils/documentUrl';

interface DocumentSelectorProps {
  selectedDocuments: string[];
  selectedCollection?: string;
  onDocumentsChange: (documentIds: string[]) => void;
  onCollectionChange: (collectionId?: string) => void;
  onClose: () => void;
  className?: string;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocuments,
  selectedCollection,
  onDocumentsChange,
  onCollectionChange,
  onClose,
  className = '',
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'collections'>('documents');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load documents first (required)
      const docsData = await apiService.getDocuments();
      const completedDocs = docsData.filter(doc => doc.processing_status === 'completed');
      setDocuments(completedDocs);
      
      // Try to load collections (optional - may not be implemented yet)
      try {
        const collectionsData = await apiService.getCollections();
        setCollections(collectionsData);
      } catch (collectionsError) {
        console.warn('Collections API not available:', collectionsError);
        setCollections([]); // Set empty array if collections not available
      }
      
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDocument = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onDocumentsChange(selectedDocuments.filter(id => id !== documentId));
    } else {
      onDocumentsChange([...selectedDocuments, documentId]);
    }
  };

  const selectCollection = (collectionId: string) => {
    if (selectedCollection === collectionId) {
      onCollectionChange(undefined);
    } else {
      onCollectionChange(collectionId);
      onDocumentsChange([]); // Clear individual document selection
    }
  };

  const clearSelection = () => {
    onDocumentsChange([]);
    onCollectionChange(undefined);
  };

  const handleDocumentUploaded = (newDocument: Document) => {
    setDocuments(prev => [newDocument, ...prev]);
    // Auto-select the newly uploaded document
    onDocumentsChange([...selectedDocuments, newDocument.id]);
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <Button
          onClick={() => setActiveTab('documents')}
          variant={activeTab === 'documents' ? 'primary' : 'ghost'}
          size="sm"
        >
          Documents ({filteredDocuments.length})
        </Button>
        {collections.length > 0 && (
          <Button
            onClick={() => setActiveTab('collections')}
            variant={activeTab === 'collections' ? 'primary' : 'ghost'}
            size="sm"
          >
            Collections ({filteredCollections.length})
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          icon={Search}
          iconPosition="left"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Selection Summary */}
      {(selectedDocuments.length > 0 || selectedCollection) && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-300">
              {selectedCollection 
                ? `Collection: ${collections.find(c => c.id === selectedCollection)?.name}`
                : `${selectedDocuments.length} document${selectedDocuments.length !== 1 ? 's' : ''} selected`
              }
            </span>
            <button
              onClick={clearSelection}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-h-80 overflow-y-auto space-y-2">
        {(activeTab === 'documents' || collections.length === 0) ? (
          filteredDocuments.length > 0 ? (
            filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  document.processing_status === 'processing'
                    ? 'border-gray-600 opacity-75 cursor-not-allowed'
                    : selectedDocuments.includes(document.id)
                    ? 'border-blue-500 bg-blue-900/20 cursor-pointer'
                    : 'border-gray-600 hover:border-gray-500 cursor-pointer'
                }`}
                onClick={() => document.processing_status === 'completed' && toggleDocument(document.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {document.processing_status === 'processing' ? (
                      <Loader className="h-5 w-5 text-blue-400 flex-shrink-0 animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-100 truncate">
                          {document.original_filename}
                        </p>
                        {document.processing_status === 'processing' && (
                          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">
                            Processing...
                          </span>
                        )}
                        {document.processing_status === 'failed' && (
                          <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded-full">
                            Failed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {document.file_type.toUpperCase()} • {document.chunk_count} chunks
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* View/Download Button */}
                    {document.document_url && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDocument(document.document_url, document.file_type, document.original_filename);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-200 p-1"
                        title={canViewInBrowser(document.file_type) ? 'View document' : 'Download document'}
                      >
                        {canViewInBrowser(document.file_type) ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {/* Selection Check */}
                    {selectedDocuments.includes(document.id) && (
                      <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No documents found</p>
            </div>
          )
        ) : (
          filteredCollections.length > 0 ? (
            filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedCollection === collection.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => selectCollection(collection.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">
                      {collection.name}
                    </p>
                    {collection.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {collection.document_ids.length} document{collection.document_ids.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {selectedCollection === collection.id && (
                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No collections found</p>
            </div>
          )
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center space-x-3 mt-6">
        <UploadSection onDocumentUploaded={handleDocumentUploaded} />
        <Button onClick={onClose} variant="secondary" size="sm">
          Done
        </Button>
      </div>
    </div>
  );
};

interface UploadSectionProps {
  onDocumentUploaded: (document: Document) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onDocumentUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      
      const uploadResponse = await apiService.uploadDocument(file);
      
      // Add document immediately to the list, even if still processing
      onDocumentUploaded(uploadResponse);
      
      // Poll for processing completion with better timeout handling
      let document = uploadResponse;
      let pollAttempts = 0;
      const maxAttempts = 30; // Maximum 30 seconds of polling
      
      while (document.processing_status === 'processing' && pollAttempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
        try {
          document = await apiService.getDocument(document.id);
          pollAttempts++;
          
          // Update the document in the list if status changed
          if (document.processing_status !== 'processing') {
            // Refresh the documents list to show updated status
            loadData();
            break;
          }
        } catch (pollError) {
          console.warn('Failed to poll document status:', pollError);
          break;
        }
      }
      
      // Don't show error if processing is still ongoing - it might complete later
      if (document.processing_status === 'failed') {
        setError('Document processing failed');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md"
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        size="sm"
        disabled={uploading}
        className="flex items-center space-x-2"
      >
        {uploading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        <span>{uploading ? 'Uploading...' : 'Upload'}</span>
      </Button>
      
      {error && (
        <span className="text-xs text-red-400 ml-2">{error}</span>
      )}
    </div>
  );
};