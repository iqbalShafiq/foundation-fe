import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType, ModelType } from "../../types/chat";
import { apiService } from "../../services/api";
import { modelStorage } from "../../utils/modelStorage";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput, { ChatInputRef } from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import ThinkingIndicator from "./ThinkingIndicator";
import ConversationSidebar from "./ConversationSidebar";
import AllConversations from "./AllConversations";
import PlotlyChart from "./PlotlyChart";

const Chat: React.FC = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>(() => modelStorage.load("Standard"));
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState("");
  const [currentChartContent, setCurrentChartContent] = useState<any>(null);
  const [currentThinkingContent, setCurrentThinkingContent] = useState("");
  const [currentReasoningContent, setCurrentReasoningContent] = useState("");
  const [streamingPhase, setStreamingPhase] = useState<'thinking' | 'reasoning' | 'answer' | null>(null);
  const [currentMessageType, setCurrentMessageType] = useState<'text' | 'chart'>('text');
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string>("");
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [preservedContext, setPreservedContext] = useState<{documents: string[], collection?: string} | null>(null);
  const [isNewConversationNavigation, setIsNewConversationNavigation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const previousConversationId = useRef<string | undefined>(conversationId);

  // Determine current view based on URL
  const currentView = location.pathname === '/conversations' ? 'all-conversations' : 'chat';
  const currentConversationId = conversationId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamContent]);

  // Load conversation when conversationId changes from URL
  useEffect(() => {
    const isConversationSwitch = previousConversationId.current !== conversationId;
    previousConversationId.current = conversationId;
    
    if (conversationId) {
      // Skip loading if this is a new conversation navigation during streaming (to prevent interrupting stream)
      if (isNewConversationNavigation && isStreaming) {
        return;
      }
      
      // Load conversation if:
      // 1. It's a conversation switch (including from undefined to a conversationId)
      // 2. OR we have a conversationId but no messages (page refresh scenario)
      if (isConversationSwitch || (conversationId && messages.length === 0)) {
        // If we're streaming and this is a different conversation, stop the stream first
        if (isStreaming) {
          setIsStreaming(false);
          setCurrentStreamContent("");
          setCurrentChartContent(null);
          setCurrentThinkingContent("");
          setCurrentReasoningContent("");
          setStreamingPhase(null);
        }
        loadConversation(conversationId);
      }
    } else {
      // Only clear state if we're not streaming (to prevent interrupting new conversation flow)
      if (!isStreaming) {
        setMessages([]);
        setCurrentConversationTitle("");
        setCurrentStreamContent("");
        setCurrentChartContent(null);
        setCurrentThinkingContent("");
        setCurrentReasoningContent("");
        setStreamingPhase(null);
        setSelectedDocuments([]);
        setSelectedCollection(undefined);
      }
    }
  }, [conversationId, isNewConversationNavigation, isStreaming, messages.length]);

  // Load conversation after streaming completes for new conversations
  useEffect(() => {
    if (conversationId && !isStreaming && messages.length > 0) {
      // Check if we need to reload the conversation to get proper message IDs
      const hasMessageWithoutId = messages.some(msg => !msg.isUser && !msg.messageId);
      if (hasMessageWithoutId) {
        loadConversation(conversationId);
      }
    }
  }, [conversationId, isStreaming, messages]);

  // Ensure input is focused when Chat component first mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      chatInputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key to exit detail conversation and start new conversation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && currentConversationId) {
        // Check if there are any open modals first
        const modals = document.querySelectorAll('[data-modal]');
        
        // Only handle ESC for new conversation if no modals are open
        if (modals.length === 0) {
          event.preventDefault();
          handleNewConversation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentConversationId]);

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  };

  // Clean up content to fix list spacing issues
  const cleanContent = (content: string) => {
    // Fix numbered lists: replace \n\n after numbered items with just \n
    return content.replace(/(\d+\.\s.*?)\n\n/g, '$1\n');
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentStreamContent("");
    setCurrentChartContent(null);
    setCurrentThinkingContent("");
    setCurrentReasoningContent("");
    setStreamingPhase(null);
    
    // Only reset document context when loading existing conversation if we're not streaming
    // This prevents context loss during new conversation navigation
    if (!isStreaming) {
      setSelectedDocuments([]);
      setSelectedCollection(undefined);
    }
    
    try {
      // Load conversation details with message history
      const conversationDetail = await apiService.getConversationDetail(conversationId);
      
      // Set conversation title
      setCurrentConversationTitle(conversationDetail.title);
      
      // Convert backend messages to frontend format
      const loadedMessages: ChatMessageType[] = conversationDetail.messages.map((msg, index) => {
        // Determine message type and content
        let messageType: 'text' | 'chart' = 'text';
        let content = msg.content;
        
        // Chart should only be displayed in assistant messages
        if (msg.role === 'assistant') {
          // Check if this assistant message has chart data
          if (msg.chart_data) {
            messageType = 'chart';
            // Combine chart data with text content
            if (msg.content && msg.content.trim()) {
              content = JSON.stringify({
                chart_data: msg.chart_data.chart_data,
                chart_type: msg.chart_data.chart_type,
                description: msg.chart_data.description,
                config: msg.chart_data.config,
                text_content: msg.content.trim()
              });
            } else {
              // Only chart data, no text content
              content = msg.chart_data;
            }
          } else {
            // Check if the previous user message has chart data (chart request)
            const prevMessage = conversationDetail.messages[index - 1];
            if (prevMessage && prevMessage.role === 'user' && prevMessage.chart_data) {
              messageType = 'chart';
              // Use chart data from user request but display in assistant response
              if (msg.content && msg.content.trim()) {
                content = JSON.stringify({
                  chart_data: prevMessage.chart_data.chart_data,
                  chart_type: prevMessage.chart_data.chart_type,
                  description: prevMessage.chart_data.description,
                  config: prevMessage.chart_data.config,
                  text_content: msg.content.trim()
                });
              } else {
                content = prevMessage.chart_data;
              }
            } else {
              // Fallback: Try to parse content for backward compatibility
              try {
                const parsedContent = JSON.parse(msg.content);
                if (parsedContent.chart_data || parsedContent.type === 'chart' || 
                    (parsedContent.data && Array.isArray(parsedContent.data))) {
                  messageType = 'chart';
                }
              } catch {
                // Content is not JSON, keep as text
              }
            }
          }
        }
        
        return {
          id: msg.id.toString(),
          content,
          type: messageType,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          model: msg.role === 'assistant' ? conversationDetail.model_type as ModelType : undefined,
          messageId: msg.role === 'assistant' ? msg.id : undefined,
          imageUrls: msg.image_urls || undefined,
          documentContext: msg.document_context,
        };
      });
      
      setMessages(loadedMessages);
      
      // Auto-select all documents that were used in this conversation
      const allDocumentIds = new Set<string>();
      let foundCollection: string | undefined;
      
      conversationDetail.messages.forEach(msg => {
        if (msg.document_context) {
          // Collect document IDs
          msg.document_context.documents.forEach(doc => {
            allDocumentIds.add(doc.document_id);
          });
          
          // Use the collection from the most recent message with context
          if (!foundCollection) {
            foundCollection = msg.document_context.collection_id;
          }
        }
      });
      
      // Set selected documents and collection if any were found
      if (allDocumentIds.size > 0) {
        setSelectedDocuments(Array.from(allDocumentIds));
        if (foundCollection) {
          setSelectedCollection(foundCollection);
        }
      }
      
      // Focus input after loading conversation
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Clear messages on error
      setMessages([]);
      
      // Focus input even on error
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSendMessage = async (content: string, images?: File[], documentContexts?: string[], contextCollection?: string) => {
    const userMessage: ChatMessageType = {
      id: generateMessageId(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message first
    setMessages((prev) => [...prev, userMessage]);
    
    // Set streaming state to show thinking indicator
    setIsStreaming(true);
    setCurrentStreamContent("");
    setCurrentChartContent(null);
    setCurrentThinkingContent("");
    setCurrentReasoningContent("");
    setStreamingPhase('thinking');
    setCurrentMessageType('text');

    // Preserve document context for new conversations
    if (!currentConversationId && (documentContexts?.length || contextCollection)) {
      setPreservedContext({
        documents: documentContexts || [],
        collection: contextCollection
      });
    }

    // Give UI time to render user message and thinking indicator before starting stream
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const assistantMessage: ChatMessageType = {
        id: generateMessageId(),
        content: "",
        isUser: false,
        timestamp: new Date(),
        model: selectedModel,
      };

      let fullContent = "";
      let receivedConversationId = currentConversationId;
      const wasNewConversation = !currentConversationId;

      for await (const chunk of apiService.streamChat(
        content,
        selectedModel,
        currentConversationId,
        images,
        documentContexts,
        contextCollection
      )) {
        if (chunk.error) {
          throw new Error(chunk.error);
        }

        // Handle streaming response based on backend hybrid system
        if (chunk.type) {
          switch (chunk.type) {
            case "reset":
              // Clear all previous answer content before starting fresh
              fullContent = "";
              setCurrentStreamContent("");
              setCurrentChartContent(null);
              setCurrentThinkingContent("");
              setCurrentReasoningContent("");
              setStreamingPhase('answer');
              break;
            case "chart":
              // Handle chart response - store chart separately
              setCurrentChartContent(chunk.content);
              setCurrentMessageType('chart');
              setStreamingPhase('answer');
              setCurrentThinkingContent("");
              setCurrentReasoningContent("");
              // Don't overwrite fullContent for chart, keep it separate
              break;
            case "answer":
              // React Agent response (CSV/Excel analysis) - this is text content after chart
              if (streamingPhase !== 'answer') {
                setStreamingPhase('answer');
                // Clear any thinking content when answer starts
                setCurrentThinkingContent("");
                setCurrentReasoningContent("");
              }
              if (chunk.content) {
                fullContent += chunk.content;
                setCurrentStreamContent(fullContent);
              }
              break;
            case "thinking":
              // Future feature - show thinking process for React Agent
              if (streamingPhase !== 'thinking') {
                setStreamingPhase('thinking');
              }
              if (chunk.content) {
                setCurrentThinkingContent(prev => prev + chunk.content);
              }
              break;
            case "reasoning":
              // Future feature - show reasoning process for React Agent
              if (streamingPhase !== 'reasoning') {
                setStreamingPhase('reasoning');
              }
              if (chunk.content) {
                setCurrentReasoningContent(prev => prev + chunk.content);
              }
              break;
          }
        } else if (chunk.content) {
          // ChatOpenAI response (normal chat & documents) or text answer after chart
          if (streamingPhase !== 'answer') {
            setStreamingPhase('answer');
            // Clear any thinking content when answer starts
            setCurrentThinkingContent("");
            setCurrentReasoningContent("");
          }
          fullContent += chunk.content;
          setCurrentStreamContent(fullContent);
        }

        if (chunk.conversation_id && !receivedConversationId) {
          receivedConversationId = chunk.conversation_id;
          // Navigate smoothly without interrupting current state
          if (wasNewConversation) {
            // Mark this as new conversation navigation to prevent reloading
            setIsNewConversationNavigation(true);
            // Use setTimeout to ensure navigation doesn't interrupt current render
            setTimeout(() => {
              navigate(`/conversation/${receivedConversationId}`, { replace: true });
              // Set a temporary title to avoid showing empty title during navigation
              if (!currentConversationTitle) {
                setCurrentConversationTitle("New Conversation");
              }
            }, 0);
          }
        }

        if (chunk.done) {
          // If we have both chart and text content, combine them properly
          if (currentChartContent && fullContent.trim()) {
            // Store both chart and text content
            assistantMessage.content = JSON.stringify({
              chart_data: currentChartContent.chart_data || currentChartContent,
              text_content: fullContent.trim(),
              chart_type: currentChartContent.chart_type,
              description: currentChartContent.description,
              config: currentChartContent.config || {}
            });
            assistantMessage.type = 'chart';
          } else if (currentChartContent) {
            // Only chart content
            assistantMessage.content = currentChartContent;
            assistantMessage.type = 'chart';
          } else {
            // Only text content
            assistantMessage.content = fullContent;
            assistantMessage.type = 'text';
          }
          
          assistantMessage.thinkingContent = currentThinkingContent;
          assistantMessage.reasoningContent = currentReasoningContent;
          
          // Store context sources if available
          if (chunk.context_sources) {
            (assistantMessage as any).contextSources = chunk.context_sources;
          }
          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentStreamContent("");
          setCurrentChartContent(null);
          setCurrentThinkingContent("");
          setCurrentReasoningContent("");
          setStreamingPhase(null);
          setCurrentMessageType('text');
          
          // Trigger sidebar refresh after conversation is completed (only for new conversations)
          if (wasNewConversation && receivedConversationId) {
            setSidebarRefreshTrigger(prev => prev + 1);
            // Reset the new conversation navigation flag
            setIsNewConversationNavigation(false);
          }
          
          // Restore preserved context after streaming completes
          if (preservedContext) {
            setTimeout(() => {
              setSelectedDocuments(preservedContext.documents);
              setSelectedCollection(preservedContext.collection);
              setPreservedContext(null);
            }, 100);
          }
          
          // Fetch updated conversation to get message IDs for feedback
          if (receivedConversationId) {
            try {
              const conversationDetail = await apiService.getConversationDetail(receivedConversationId);
              
              // Update conversation title if it's a new conversation
              if (wasNewConversation) {
                setCurrentConversationTitle(conversationDetail.title);
              }
              
              const updatedMessages: ChatMessageType[] = conversationDetail.messages.map((msg, index) => {
                // Determine message type and content
                let messageType: 'text' | 'chart' = 'text';
                let content = msg.content;
                
                // Chart should only be displayed in assistant messages
                if (msg.role === 'assistant') {
                  // Check if this assistant message has chart data
                  if (msg.chart_data) {
                    messageType = 'chart';
                    // Combine chart data with text content
                    if (msg.content && msg.content.trim()) {
                      content = JSON.stringify({
                        chart_data: msg.chart_data.chart_data,
                        chart_type: msg.chart_data.chart_type,
                        description: msg.chart_data.description,
                        config: msg.chart_data.config,
                        text_content: msg.content.trim()
                      });
                    } else {
                      // Only chart data, no text content
                      content = msg.chart_data;
                    }
                  } else {
                    // Check if the previous user message has chart data (chart request)
                    const prevMessage = conversationDetail.messages[index - 1];
                    if (prevMessage && prevMessage.role === 'user' && prevMessage.chart_data) {
                      messageType = 'chart';
                      // Use chart data from user request but display in assistant response
                      if (msg.content && msg.content.trim()) {
                        content = JSON.stringify({
                          chart_data: prevMessage.chart_data.chart_data,
                          chart_type: prevMessage.chart_data.chart_type,
                          description: prevMessage.chart_data.description,
                          config: prevMessage.chart_data.config,
                          text_content: msg.content.trim()
                        });
                      } else {
                        content = prevMessage.chart_data;
                      }
                    } else {
                      // Fallback: Try to parse content for backward compatibility
                      try {
                        const parsedContent = JSON.parse(msg.content);
                        if (parsedContent.chart_data || parsedContent.type === 'chart' || 
                            (parsedContent.data && Array.isArray(parsedContent.data))) {
                          messageType = 'chart';
                        }
                      } catch {
                        // Content is not JSON, keep as text
                      }
                    }
                  }
                }
                
                return {
                  id: msg.id.toString(),
                  content,
                  type: messageType,
                  isUser: msg.role === 'user',
                  timestamp: new Date(msg.created_at),
                  model: msg.role === 'assistant' ? conversationDetail.model_type as ModelType : undefined,
                  messageId: msg.role === 'assistant' ? msg.id : undefined,
                  imageUrls: msg.image_urls || undefined,
                };
              });
              setMessages(updatedMessages);
            } catch (error) {
              console.error('Error fetching updated conversation:', error);
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessageType = {
        id: generateMessageId(),
        content:
          "Sorry, I encountered an error processing your message. Please try again.",
        isUser: false,
        timestamp: new Date(),
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentStreamContent("");
      setCurrentChartContent(null);
      setCurrentThinkingContent("");
      setCurrentReasoningContent("");
      setStreamingPhase(null);
    } finally {
      setIsStreaming(false);
      // Focus back to input after streaming is complete
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    // Reset the new conversation navigation flag when user manually selects a conversation
    setIsNewConversationNavigation(false);
    navigate(`/conversation/${conversationId}`);
  };

  const handleNewConversation = () => {
    // Reset the new conversation navigation flag when starting a new conversation
    setIsNewConversationNavigation(false);
    navigate('/');
  };

  const handleShowAllConversations = () => {
    navigate('/conversations');
  };

  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
    modelStorage.save(model);
  };

  const handleAddDocumentToContext = (documentId: string) => {
    // Add document to current context if not already selected
    if (!selectedDocuments.includes(documentId)) {
      setSelectedDocuments(prev => [...prev, documentId]);
    }
    
    // Focus input
    chatInputRef.current?.focus();
  };

  const handleRemoveDocumentFromContext = (documentId: string) => {
    // Remove document from current context
    setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    
    // Focus input
    chatInputRef.current?.focus();
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onShowAllConversations={handleShowAllConversations}
        refreshTrigger={sidebarRefreshTrigger}
        currentView={currentView}
      />

      {/* Main Content Area */}
      {currentView === 'all-conversations' ? (
        <AllConversations onSelectConversation={handleSelectConversation} />
      ) : (
        <div className="flex-1 flex flex-col bg-gray-800">
          <ChatHeader title={currentConversationTitle} />

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto h-full">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-3">
                      Welcome to Foundation Chat
                    </h3>
                    <p className="text-gray-400 max-w-md leading-relaxed">
                      Start a conversation by typing a message below. I'm here
                      to help with any questions you might have!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Collect all images from the conversation
                    const allImages = messages
                      .filter(msg => msg.imageUrls && msg.imageUrls.length > 0)
                      .flatMap(msg => msg.imageUrls!);
                    
                    return messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        conversationImages={allImages}
                        onAddDocumentToContext={handleAddDocumentToContext}
                        onRemoveDocumentFromContext={handleRemoveDocumentFromContext}
                        selectedDocuments={selectedDocuments}
                      />
                    ));
                  })()}

                  {isStreaming && (
                    <>
                      {/* Show thinking indicator for React Agent (future feature) */}
                      {streamingPhase === 'thinking' && (
                        <ThinkingIndicator 
                          content={currentThinkingContent}
                          phase="thinking"
                        />
                      )}
                      {streamingPhase === 'reasoning' && (
                        <ThinkingIndicator 
                          content={currentReasoningContent}
                          phase="reasoning"
                        />
                      )}
                      {/* Show streaming answer for both ChatOpenAI and React Agent */}
                      {streamingPhase === 'answer' && (currentStreamContent || currentChartContent) && (
                        <div className="flex items-start space-x-3 py-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <span className="text-sm">🤖</span>
                          </div>
                          <div className="flex-1 max-w-4xl">
                            {/* Show chart if we have chart content */}
                            {currentChartContent && (
                              <div className="mb-4">
                                <PlotlyChart data={currentChartContent} />
                              </div>
                            )}
                            
                            {/* Show text content if we have any */}
                            {currentStreamContent && (
                              <div className="inline-block px-5 py-3 bg-gray-700 rounded-2xl rounded-tl-md shadow-md">
                                <div className="prose prose-sm max-w-none break-words text-gray-100">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                      p: ({ children, node }) => {
                                        // Check if this paragraph is inside a list item
                                        const isInListItem = (node as any)?.parent?.tagName === 'li';
                                        return (
                                          <p className={`m-0 leading-relaxed ${isInListItem ? 'whitespace-normal' : 'whitespace-pre-wrap'}`}>
                                            {children}
                                          </p>
                                        );
                                      },
                                      h1: ({ children }) => <h1 className="text-lg font-bold mt-2 mb-1 first:mt-0 text-gray-100">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-base font-bold mt-2 mb-1 first:mt-0 text-gray-100">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0 text-gray-100">{children}</h3>,
                                      ul: ({ children }) => <ul className="my-2 pl-6 first:mt-0 last:mb-0 list-disc list-outside space-y-0">{children}</ul>,
                                      ol: ({ children }) => <ol className="my-2 pl-6 first:mt-0 last:mb-0 list-decimal list-outside space-y-0">{children}</ol>,
                                      li: ({ children }) => <li className="leading-relaxed [&>p]:m-0 [&>p]:leading-relaxed">{children}</li>,
                                      blockquote: ({ children }) => (
                                        <blockquote className="border-l-2 border-blue-400 pl-3 my-2 first:mt-0 last:mb-0">
                                          {children}
                                        </blockquote>
                                      ),
                                      code: ({ inline, children, ...props }: any) => {
                                        if (inline) {
                                          return (
                                            <code
                                              className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-600 text-gray-200"
                                              {...props}
                                            >
                                              {children}
                                            </code>
                                          );
                                        }
                                        return (
                                          <code
                                            className="block p-3 rounded-md text-xs font-mono overflow-x-auto my-2 first:mt-0 last:mb-0 bg-gray-900 text-gray-100"
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
                                          className="underline hover:no-underline text-blue-400"
                                        >
                                          {children}
                                        </a>
                                      ),
                                      hr: () => (
                                        <hr className="my-3 border-0 h-px bg-gray-600" />
                                      ),
                                    }}
                                  >
                                    {cleanContent(currentStreamContent)}
                                  </ReactMarkdown>
                                  <span className="animate-pulse">|</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Timestamp and model info */}
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              <span>
                                {new Date().toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="mx-1">•</span>
                              <span>{selectedModel}</span>
                              {currentChartContent && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>Chart</span>
                                </>
                              )}
                              {currentStreamContent && <span className="animate-pulse ml-1">|</span>}
                            </div>
                          </div>
                        </div>
                      )}
                      {!streamingPhase && (
                        <TypingIndicator />
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <ChatInput 
            ref={chatInputRef}
            onSendMessage={handleSendMessage} 
            disabled={isStreaming}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            disableModelSelection={currentConversationId !== undefined}
            externalSelectedDocuments={selectedDocuments}
            externalSelectedCollection={selectedCollection}
            onExternalDocumentsChange={setSelectedDocuments}
            onExternalCollectionChange={setSelectedCollection}
          />
        </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
