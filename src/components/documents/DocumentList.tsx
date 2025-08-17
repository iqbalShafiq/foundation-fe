import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Button, Card } from '../ui';
import { apiService } from '../../services/api';
import { Document, DocumentStatus } from '../../types/document';
import { openDocument, canViewInBrowser } from '../../utils/documentUrl';

interface DocumentListProps {
  onDocumentSelect?: (document: Document) => void;
  selectedDocuments?: string[];
  allowMultiSelect?: boolean;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  onDocumentSelect,
  selectedDocuments = [],
  allowMultiSelect = false,
  className = '',
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await apiService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiService.deleteDocument(documentId);
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      const updatedDoc = await apiService.reprocessDocument(documentId);
      setDocuments(docs => docs.map(doc => 
        doc.id === documentId ? updatedDoc : doc
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprocess document');
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'processing':
        return <Clock className="h-3 w-3 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return 'Processed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    // Handle timezone correctly - assume UTC from backend
    const date = new Date(dateString + 'Z'); // Add Z to indicate UTC
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const isSelected = (documentId: string) => selectedDocuments.includes(documentId);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button 
          onClick={loadDocuments} 
          variant="secondary" 
          size="sm" 
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No documents yet</h3>
        <p className="text-gray-500">Upload your first document to get started</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">
          Documents ({documents.length})
        </h3>
        <Button onClick={loadDocuments} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {documents.map((document) => (
        <Card
          key={document.id}
          className={`p-4 transition-all duration-200 cursor-pointer border ${
            isSelected(document.id)
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => onDocumentSelect?.(document)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-100 truncate">
                    {document.original_filename}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(document.processing_status)}
                    <span className="text-xs text-gray-400">
                      {getStatusText(document.processing_status)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span>{document.file_type.toUpperCase()}</span>
                  <span>{formatFileSize(document.file_size)}</span>
                  {document.chunk_count && (
                    <span>{document.chunk_count} chunks</span>
                  )}
                  <span>
                    {formatTimeAgo(document.created_at)}
                  </span>
                </div>

                {document.processing_status === 'failed' && document.error_message && (
                  <div className="mt-2 text-xs text-red-400">
                    Error: {document.error_message}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4" onClick={e => e.stopPropagation()}>
              {/* View/Download Document Button */}
              {document.processing_status === 'completed' && document.document_url && (
                <Button
                  onClick={() => openDocument(document.document_url, document.file_type, document.original_filename)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-200"
                  title={canViewInBrowser(document.file_type) ? 'View document' : 'Download document'}
                >
                  {canViewInBrowser(document.file_type) ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}

              {document.processing_status === 'failed' && (
                <Button
                  onClick={() => handleReprocess(document.id)}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300"
                  title="Reprocess document"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                onClick={() => handleDelete(document.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                title="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};