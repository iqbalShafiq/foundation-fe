import React, { useState } from 'react';
import { DocumentContext } from '../../types/chat';
import { FileText, ChevronDown, ChevronUp, Database, Eye } from 'lucide-react';
import { openDocument } from '../../utils/documentUrl';

interface DocumentContextIndicatorProps {
  documentContext: DocumentContext;
  variant?: 'full' | 'compact';
  onAddToContext?: (documentId: string) => void;
  onRemoveFromContext?: (documentId: string) => void;
  selectedDocuments?: string[];
}

export const DocumentContextIndicator: React.FC<DocumentContextIndicatorProps> = ({ 
  documentContext, 
  variant = 'full',
  onAddToContext,
  onRemoveFromContext,
  selectedDocuments = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);

  const getFileIcon = (extension: string, isSelected: boolean, isHovered: boolean) => {
    const iconColor = isSelected && isHovered 
      ? 'text-red-400' 
      : isSelected 
        ? 'text-blue-400' 
        : 'text-blue-400';
    return <FileText className={`w-4 h-4 ${iconColor}`} />;
  };

  const handleDocumentClick = (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const isSelected = selectedDocuments.includes(docId);
    
    if (isSelected) {
      // Remove from context if already selected
      if (onRemoveFromContext) {
        onRemoveFromContext(docId);
      }
    } else {
      // Add to context if not selected
      if (onAddToContext) {
        onAddToContext(docId);
      }
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
          {documentContext.documents.map((doc, index) => {
            const isSelected = selectedDocuments.includes(doc.document_id);
            const isHovered = hoveredDocId === doc.document_id;
            
            return (
              <div 
                key={doc.document_id} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200 group ${
                  isSelected && isHovered
                    ? 'bg-red-900/30 border border-red-700' 
                    : isSelected
                      ? 'bg-gray-800 hover:bg-gray-700 border border-blue-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onMouseEnter={() => setHoveredDocId(doc.document_id)}
                onMouseLeave={() => setHoveredDocId(null)}
                onClick={(e) => handleDocumentClick(doc.document_id, e)}
                title={isSelected ? 'Click to remove from context' : 'Click to add to context'}
              >
                {getFileIcon(doc.file_extension, isSelected, isHovered)}
                <span className={`text-sm truncate flex-1 transition-colors duration-200 ${
                  isSelected && isHovered
                    ? 'text-red-400'
                    : isSelected
                      ? 'text-blue-400'
                      : 'text-gray-200 group-hover:text-blue-400'
                }`}>
                  {doc.title}
                </span>
              <div className="flex items-center justify-center w-12 h-6 flex-shrink-0">
                {hoveredDocId === doc.document_id ? (
                  <button
                    onClick={(e) => handleDownloadClick(doc, e)}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors duration-200 ${
                      isSelected && isHovered
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-blue-400 hover:text-blue-300'
                    }`}
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
            );
          })}
        </div>
      )}
    </div>
  );
};