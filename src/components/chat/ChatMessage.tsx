import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChatMessage as ChatMessageType, FeedbackType } from '../../types/chat';
import { User, Bot, Copy, Check, ThumbsUp, ThumbsDown, FileText, ExternalLink } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { DocumentContextIndicator } from './DocumentContextIndicator';
import { ImageViewer } from '../ui';
import { apiService } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

interface ChatMessageProps {
  message: ChatMessageType;
  conversationImages?: string[];
  onAddDocumentToContext?: (documentId: string) => void;
  onRemoveDocumentFromContext?: (documentId: string) => void;
  selectedDocuments?: string[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, conversationImages = [], onAddDocumentToContext, onRemoveDocumentFromContext, selectedDocuments = [] }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userFeedback, setUserFeedback] = useState<FeedbackType | null>(null);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<FeedbackType>('like');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFeedbackClick = (feedbackType: FeedbackType) => {
    if (!message.messageId) {
      console.error('No message ID available for feedback');
      return;
    }
    
    setSelectedFeedbackType(feedbackType);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedbackType: FeedbackType, description?: string) => {
    if (!message.messageId) {
      throw new Error('No message ID available for feedback');
    }

    try {
      await apiService.createFeedback({
        message_id: message.messageId,
        feedback_type: feedbackType,
        description,
      });
      
      setUserFeedback(feedbackType);
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  };

  // Clean up content to fix list spacing issues
  const cleanContent = (content: string) => {
    // Fix numbered lists: replace \n\n after numbered items with just \n
    return content.replace(/(\d+\.\s.*?)\n\n/g, '$1\n');
  };

  return (
    <div className={`flex items-start space-x-3 py-3 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
        message.isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-blue-600 text-white'
      }`}>
        {message.isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>
      
      <div className={`${message.isUser ? 'flex-1 flex flex-col items-end' : 'flex-1'} max-w-3xl`}>
        {/* Display images above message content */}
        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className={`mb-2 ${message.isUser ? 'flex justify-end' : ''}`}>
            <div className={`${message.isUser ? 'max-w-fit' : 'inline-block'}`}>
              <div className="flex flex-wrap gap-2">
                {message.imageUrls.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={getImageUrl(imageUrl)}
                    alt={`Attachment ${index + 1}`}
                    className="max-w-xs max-h-64 object-cover rounded-lg border border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => {
                      const imageIndex = conversationImages.indexOf(imageUrl);
                      setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
                      setImageViewerOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className={`${message.isUser ? 'max-w-fit' : 'inline-block'} px-5 py-3 shadow-md ${
          message.isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
            : 'bg-gray-700 text-gray-100 rounded-2xl rounded-tl-md'
        }`}>
          <div className={`prose prose-sm max-w-none break-words ${message.isUser ? 'text-white' : 'text-gray-100'}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Override default styling for better chat bubble appearance
                p: ({ children, node }) => {
                  // Check if this paragraph is inside a list item
                  const isInListItem = (node as any)?.parent?.tagName === 'li';
                  return (
                    <p className={`m-0 leading-relaxed ${isInListItem ? 'whitespace-normal' : 'whitespace-pre-wrap'}`}>
                      {children}
                    </p>
                  );
                },
                h1: ({ children }) => <h1 className={`text-lg font-bold mt-2 mb-1 first:mt-0 ${message.isUser ? 'text-white' : 'text-gray-100'}`}>{children}</h1>,
                h2: ({ children }) => <h2 className={`text-base font-bold mt-2 mb-1 first:mt-0 ${message.isUser ? 'text-white' : 'text-gray-100'}`}>{children}</h2>,
                h3: ({ children }) => <h3 className={`text-sm font-bold mt-2 mb-1 first:mt-0 ${message.isUser ? 'text-white' : 'text-gray-100'}`}>{children}</h3>,
                ul: ({ children }) => <ul className="my-2 pl-6 first:mt-0 last:mb-0 list-disc list-outside space-y-0">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 pl-6 first:mt-0 last:mb-0 list-decimal list-outside space-y-0">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed [&>p]:m-0 [&>p]:leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-2 pl-3 my-2 first:mt-0 last:mb-0 ${
                    message.isUser ? 'border-white/30' : 'border-blue-400'
                  }`}>
                    {children}
                  </blockquote>
                ),
                code: ({ inline, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code
                        className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                          message.isUser 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-600 text-gray-200'
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={`block p-3 rounded-md text-xs font-mono overflow-x-auto my-2 first:mt-0 last:mb-0 ${
                        message.isUser
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-900 text-gray-100'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <div className="my-2 first:mt-0 last:mb-0">{children}</div>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline hover:no-underline ${
                      message.isUser ? 'text-white' : 'text-blue-400'
                    }`}
                  >
                    {children}
                  </a>
                ),
                hr: () => (
                  <hr className={`my-3 border-0 h-px ${
                    message.isUser ? 'bg-white/20' : 'bg-gray-600'
                  }`} />
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2 first:mt-0 last:mb-0">
                    <table className={`min-w-full border ${
                      message.isUser ? 'border-white/30' : 'border-gray-600'
                    }`}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className={message.isUser ? 'bg-white/10' : 'bg-gray-600'}>
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className={`px-3 py-2 text-left font-semibold border ${
                    message.isUser ? 'border-white/30' : 'border-gray-600'
                  }`}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className={`px-3 py-2 border ${
                    message.isUser ? 'border-white/30' : 'border-gray-600'
                  }`}>
                    {children}
                  </td>
                ),
              }}
            >
              {cleanContent(message.content)}
            </ReactMarkdown>
          </div>
        </div>

        {/* Show thinking/reasoning content for React Agent responses (CSV/Excel analysis) */}
        {!message.isUser && (message.thinkingContent || message.reasoningContent) && (
          <div className="mt-2 space-y-2">
            {message.thinkingContent && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></span>
                  <span>Show thinking process</span>
                  <span className="group-open:rotate-90 transition-transform duration-200">▶</span>
                </summary>
                <div className="mt-2 px-3 py-2 bg-gray-800 rounded-md border border-gray-600">
                  <div className="text-xs text-gray-300 whitespace-pre-wrap">
                    {message.thinkingContent}
                  </div>
                </div>
              </details>
            )}
            {message.reasoningContent && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full opacity-60"></span>
                  <span>Show reasoning process</span>
                  <span className="group-open:rotate-90 transition-transform duration-200">▶</span>
                </summary>
                <div className="mt-2 px-3 py-2 bg-gray-800 rounded-md border border-gray-600">
                  <div className="text-xs text-gray-300 whitespace-pre-wrap">
                    {message.reasoningContent}
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Document Context Indicator */}
        {message.documentContext && (
          <DocumentContextIndicator 
            documentContext={message.documentContext} 
            variant="full"
            onAddToContext={onAddDocumentToContext}
            onRemoveFromContext={onRemoveDocumentFromContext}
            selectedDocuments={selectedDocuments}
          />
        )}

        {/* Context Sources */}
        {!message.isUser && message.contextSources && message.contextSources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="text-xs text-gray-400 mb-2">Sources:</div>
            <div className="space-y-1">
              {message.contextSources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate flex-1">{source.document_name}</span>
                  {source.page_number && (
                    <span className="text-gray-500">p.{source.page_number}</span>
                  )}
                  <span className="text-gray-500">
                    {Math.round(source.relevance_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={`flex items-center mt-2 text-xs text-gray-400 ${
          message.isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.model && !message.isUser && (
            <>
              <span className="mx-1">•</span>
              <span>{message.model}</span>
            </>
          )}
          {!message.isUser && (
            <>
              <button
                onClick={handleCopy}
                className={`ml-2 transition-colors duration-200 ${
                  isCopied 
                    ? 'text-green-400' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title={isCopied ? "Copied!" : "Copy message"}
              >
                {isCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              
              {message.messageId && (
                <>
                  <button
                    onClick={() => handleFeedbackClick('like')}
                    className={`ml-2 transition-colors duration-200 ${
                      userFeedback === 'like'
                        ? 'text-green-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  
                  <button
                    onClick={() => handleFeedbackClick('dislike')}
                    className={`ml-2 transition-colors duration-200 ${
                      userFeedback === 'dislike'
                        ? 'text-red-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {!message.isUser && message.messageId && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
          initialFeedbackType={selectedFeedbackType}
        />
      )}
      
      {/* Image Viewer */}
      <ImageViewer
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={conversationImages}
        initialIndex={selectedImageIndex}
      />
    </div>
  );
};

export default ChatMessage;