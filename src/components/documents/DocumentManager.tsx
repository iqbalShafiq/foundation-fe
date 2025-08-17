import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Alert } from '../ui';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { DocumentUploadResponse } from '../../types/document';

interface DocumentManagerProps {
  onDocumentSelect?: (documentIds: string[]) => void;
  selectedDocuments?: string[];
  allowMultiSelect?: boolean;
  className?: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  onDocumentSelect,
  selectedDocuments = [],
  allowMultiSelect = false,
  className = '',
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = (document: DocumentUploadResponse) => {
    setUploadSuccess(`Document "${document.original_filename}" uploaded successfully`);
    setUploadError(null);
    setShowUpload(false);
    setRefreshKey(prev => prev + 1); // Force DocumentList to refresh
    
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
  };

  const handleDocumentSelect = (document: any) => {
    if (!onDocumentSelect) return;

    if (allowMultiSelect) {
      const isSelected = selectedDocuments.includes(document.id);
      if (isSelected) {
        // Remove from selection
        onDocumentSelect(selectedDocuments.filter(id => id !== document.id));
      } else {
        // Add to selection
        onDocumentSelect([...selectedDocuments, document.id]);
      }
    } else {
      // Single select
      onDocumentSelect([document.id]);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Document Manager</h2>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          variant="primary"
          icon={Plus}
          iconPosition="left"
        >
          Upload Document
        </Button>
      </div>

      {/* Alerts */}
      {uploadSuccess && (
        <Alert variant="success" title="Success">
          {uploadSuccess}
        </Alert>
      )}

      {uploadError && (
        <Alert variant="error" title="Upload Failed">
          {uploadError}
        </Alert>
      )}

      {/* Upload Section */}
      {showUpload && (
        <div className="space-y-4">
          <DocumentUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>
      )}

      {/* Document List */}
      <DocumentList
        key={refreshKey}
        onDocumentSelect={handleDocumentSelect}
        selectedDocuments={selectedDocuments}
        allowMultiSelect={allowMultiSelect}
      />

      {/* Selection Info */}
      {selectedDocuments.length > 0 && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-sm text-blue-300">
            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            {allowMultiSelect && (
              <button
                onClick={() => onDocumentSelect?.([])}
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                Clear selection
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
};