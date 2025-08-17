import React, { useState } from 'react';
import { DocumentContext } from '../../types/chat';
import { FileText, ChevronDown, ChevronUp, Database, Eye } from 'lucide-react';
import { openDocument } from '../../utils/documentUrl';

interface DocumentContextIndicatorProps {
  documentContext: DocumentContext;
  variant?: 'full' | 'compact';
  onAddToContext?: (documentId: string) => void;
}

export const DocumentContextIndicator: React.FC<DocumentContextIndicatorProps> = ({ 
  documentContext, 
  variant = 'full',
  onAddToContext 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);

  const getFileIcon = (extension: string) => {
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  const handleDocumentClick = (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onAddToContext) {
      onAddToContext(docId);
    }
  };

  const handleDownloadClick = (doc: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (doc.document_url) {
      openDocument(doc.document_url, doc.file_extension, doc.title);
    } else {
      // If no document_url, try to construct it from document_id
      const constructedUrl = `/documents/${doc.document_id}/download`;
      openDocument(constructedUrl, doc.file_extension, doc.title);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300 text-xs">
        <Database className="w-3 h-3" />
        <span>{documentContext.documents.length} doc{documentContext.documents.length > 1 ? 's' : ''}</span>
        <span className="text-blue-400">•</span>
        <span>{documentContext.context_chunks_count} chunks</span>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-blue-300 text-sm">
          <Database className="w-4 h-4" />
          <span>Used {documentContext.documents.length} document{documentContext.documents.length > 1 ? 's' : ''}</span>
          <span className="text-blue-400">•</span>
          <span>{documentContext.context_chunks_count} context chunks</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-blue-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-400" />
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {documentContext.documents.map((doc, index) => (
            <div 
              key={doc.document_id} 
              className="flex items-center gap-2 p-2 bg-gray-800 rounded-md hover:bg-gray-700 cursor-pointer transition-all duration-200 group"
              onMouseEnter={() => setHoveredDocId(doc.document_id)}
              onMouseLeave={() => setHoveredDocId(null)}
              onClick={(e) => handleDocumentClick(doc.document_id, e)}
            >
              {getFileIcon(doc.file_extension)}
              <span className="text-gray-200 text-sm truncate flex-1 group-hover:text-blue-400">
                {doc.title}
              </span>
              <div className="flex items-center justify-center w-12 h-6 flex-shrink-0">
                {hoveredDocId === doc.document_id ? (
                  <button
                    onClick={(e) => handleDownloadClick(doc, e)}
                    className="text-blue-400 hover:text-blue-300 w-6 h-6 flex items-center justify-center rounded transition-colors duration-200"
                    title="View/Download document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs uppercase w-full h-6 flex items-center justify-center truncate">
                    {doc.file_extension}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};