import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType, ModelType } from "../../types/chat";
import { UserModelCategory } from "../../types/models";
import { apiService } from "../../services/api";
import { modelStorage } from "../../utils/modelStorage";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput, { ChatInputRef } from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import ThinkingIndicator from "./ThinkingIndicator";
import AnsweringIndicator from "./AnsweringIndicator";
import ConversationSidebar from "./ConversationSidebar";
import AllConversations from "./AllConversations";
import PlotlyChart from "./PlotlyChart";
import EditMessageModal from "./EditMessageModal";

const Chat: React.FC = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>(() => modelStorage.load("Standard"));
  const [userModelCategories, setUserModelCategories] = useState<UserModelCategory[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState("");
  const [currentChartContent, setCurrentChartContent] = useState<any[]>([]); // Changed to array to support multiple charts
  const [currentThinkingContent, setCurrentThinkingContent] = useState("");
  const [currentReasoningContent, setCurrentReasoningContent] = useState("");
  const [streamingPhase, setStreamingPhase] = useState<'thinking' | 'reasoning' | 'answer' | 'answering' | null>(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string>("");
  const [currentConversationCategoryName, setCurrentConversationCategoryName] = useState<string | null>(null);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [preservedContext, setPreservedContext] = useState<{documents: string[], collection?: string} | null>(null);
  const [isNewConversationNavigation, setIsNewConversationNavigation] = useState(false);
  const [editMessageModal, setEditMessageModal] = useState<{isOpen: boolean, messageId: string, content: string}>({isOpen: false, messageId: '', content: ''});
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const previousConversationId = useRef<string | undefined>(conversationId);

  // Determine current view based on URL
  const currentView = location.pathname === '/conversations' ? 'all-conversations' : 'chat';
  const currentConversationId = conversationId;

  // Load user model categories on mount
  useEffect(() => {
    const loadUserModelCategories = async () => {
      try {
        const categories = await apiService.getUserModelCategories();
        setUserModelCategories(categories);
      } catch (error) {
        console.error('Failed to load user model categories:', error);
      }
    };
    loadUserModelCategories();
  }, []);

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
          setCurrentChartContent([]);
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
        setCurrentConversationCategoryName(null);
        setCurrentStreamContent("");
        setCurrentChartContent([]);
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

  // Get model_id for a given model category name
  const getModelIdForCategory = (categoryName: string): string => {
    // First check user model categories
    const userCategory = userModelCategories.find(cat => 
      cat.category_name === categoryName || cat.display_name === categoryName
    );
    if (userCategory) {
      return userCategory.model_id;
    }

    // Default mapping for built-in categories
    const defaultMappings: Record<string, string> = {
      'Fast': 'anthropic/claude-haiku-3.5',
      'Standard': 'anthropic/claude-sonnet-4',
      'Fast Reasoning': 'anthropic/claude-sonnet-3.5',
      'Reasoning': 'anthropic/claude-opus-3'
    };

    return defaultMappings[categoryName] || 'anthropic/claude-sonnet-4';
  };

  // Get category_id for a given model category name (for API payload)
  const getCategoryIdForCategory = (categoryName: string): number | undefined => {
    // First check user model categories
    const userCategory = userModelCategories.find(cat => 
      cat.category_name === categoryName || cat.display_name === categoryName
    );
    if (userCategory) {
      return userCategory.id;
    }

    // For built-in categories, we don't send category_id as they are handled by model_id
    return undefined;
  };

  // Get display name for model/category (for chat bubble display)
  const getDisplayNameForModel = (modelName: string): string => {
    // If we have current conversation category name, use it
    if (currentConversationCategoryName) {
      return currentConversationCategoryName;
    }

    // For new conversations, check if the selected model is a user category
    const userCategory = userModelCategories.find(cat => 
      cat.category_name === modelName || cat.display_name === modelName
    );
    if (userCategory) {
      return userCategory.display_name;
    }

    // Fall back to the model name
    return modelName;
  };

  const loadConversation = async (conversationId: string) => {
    console.log('Loading conversation:', conversationId);
    setCurrentStreamContent("");
    setCurrentChartContent([]);
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
      console.log('Conversation detail loaded:', conversationDetail);
      
      // Set conversation title and category
      setCurrentConversationTitle(conversationDetail.title);
      setCurrentConversationCategoryName(conversationDetail.category_name || null);
      
      // Convert backend messages to frontend format
      const loadedMessages: ChatMessageType[] = conversationDetail.messages.map((msg, index) => {
        // Determine message type and content
        let messageType: 'text' | 'chart' = 'text';
        let content = msg.content;
        
        // Chart should only be displayed in assistant messages
        if (msg.role === 'assistant') {
          // Check if this assistant message has chart data (single or array)
          if (msg.chart_data) {
            messageType = 'chart';

            // Handle both single chart and multiple charts
            if (Array.isArray(msg.chart_data)) {
              // Multiple charts from backend
              if (msg.content && msg.content.trim()) {
                content = JSON.stringify({
                  charts: msg.chart_data,
                  text_content: msg.content.trim()
                });
              } else {
                content = JSON.stringify({
                  charts: msg.chart_data
                });
              }
            } else {
              // Single chart - backward compatible format
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
                content = JSON.stringify(msg.chart_data);
              }
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
                content = JSON.stringify(prevMessage.chart_data);
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
          messageId: msg.role === 'user' ? msg.id : (msg.role === 'assistant' ? msg.id : undefined),
          imageUrls: msg.image_urls || undefined,
          documentContext: msg.document_context,
          input_tokens: msg.input_tokens,
          output_tokens: msg.output_tokens,
          total_tokens: msg.total_tokens,
          model_cost: msg.model_cost,
          // Branch fields
          parentMessageId: msg.parent_message_id,
          branchId: msg.branch_id,
          isActiveBranch: msg.is_active_branch,
          hasBranches: msg.has_branches,
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
      console.error('Error details:', error);
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
    setCurrentChartContent([]);
    setCurrentThinkingContent("");
    setCurrentReasoningContent("");
    setStreamingPhase('thinking');

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
        getModelIdForCategory(selectedModel),
        currentConversationId,
        getCategoryIdForCategory(selectedModel),
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
              setCurrentChartContent([]);
              setCurrentThinkingContent("");
              setCurrentReasoningContent("");
              setStreamingPhase('answering');
              break;
            case "chart":
              // Handle chart response - accumulate charts in array for multiple chart support
              setCurrentChartContent(prev => [...prev, chunk.content]);
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
              } else if (!chunk.content && !fullContent.trim()) {
                // If answer content is empty and we don't have any accumulated content, show answering
                setStreamingPhase('answering');
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
          // If we have charts (single or multiple) and text content, combine them properly
          if (currentChartContent.length > 0 && fullContent.trim()) {
            // Store both chart(s) and text content
            if (currentChartContent.length === 1) {
              // Single chart - keep backward compatible format
              const singleChart = currentChartContent[0];
              assistantMessage.content = JSON.stringify({
                chart_data: singleChart.chart_data || singleChart,
                text_content: fullContent.trim(),
                chart_type: singleChart.chart_type,
                description: singleChart.description,
                config: singleChart.config || {}
              });
            } else {
              // Multiple charts - store as array
              assistantMessage.content = JSON.stringify({
                charts: currentChartContent.map(chart => ({
                  chart_data: chart.chart_data || chart,
                  chart_type: chart.chart_type,
                  description: chart.description,
                  config: chart.config || {}
                })),
                text_content: fullContent.trim()
              });
            }
            assistantMessage.type = 'chart';
          } else if (currentChartContent.length > 0) {
            // Only chart content (no text)
            if (currentChartContent.length === 1) {
              // Single chart
              assistantMessage.content = currentChartContent[0];
            } else {
              // Multiple charts
              assistantMessage.content = JSON.stringify({
                charts: currentChartContent
              });
            }
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
          setCurrentChartContent([]);
          setCurrentThinkingContent("");
          setCurrentReasoningContent("");
          setStreamingPhase(null);
          
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
              
              // Update conversation title and category if it's a new conversation
              if (wasNewConversation) {
                setCurrentConversationTitle(conversationDetail.title);
                setCurrentConversationCategoryName(conversationDetail.category_name || null);
              }
              
              const updatedMessages: ChatMessageType[] = conversationDetail.messages.map((msg, index) => {
                // Determine message type and content
                let messageType: 'text' | 'chart' = 'text';
                let content = msg.content;

                // Chart should only be displayed in assistant messages
                if (msg.role === 'assistant') {
                  // Check if this assistant message has chart data (single or array)
                  if (msg.chart_data) {
                    messageType = 'chart';

                    // Handle both single chart and multiple charts
                    if (Array.isArray(msg.chart_data)) {
                      // Multiple charts from backend
                      if (msg.content && msg.content.trim()) {
                        content = JSON.stringify({
                          charts: msg.chart_data,
                          text_content: msg.content.trim()
                        });
                      } else {
                        content = JSON.stringify({
                          charts: msg.chart_data
                        });
                      }
                    } else {
                      // Single chart - backward compatible format
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
                        content = JSON.stringify(msg.chart_data);
                      }
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
                        content = JSON.stringify(prevMessage.chart_data);
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
                  messageId: msg.role === 'user' ? msg.id : (msg.role === 'assistant' ? msg.id : undefined),
                  imageUrls: msg.image_urls || undefined,
                  documentContext: msg.document_context,
                  input_tokens: msg.input_tokens,
                  output_tokens: msg.output_tokens,
                  total_tokens: msg.total_tokens,
                  model_cost: msg.model_cost,
                  // Branch fields
                  parentMessageId: msg.parent_message_id,
                  branchId: msg.branch_id,
                  isActiveBranch: msg.is_active_branch,
                  hasBranches: msg.has_branches,
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
      setCurrentChartContent([]);
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

  const handleEditMessage = (messageId: string) => {
    // Find the message to edit
    const messageToEdit = messages.find(msg => msg.messageId?.toString() === messageId);
    if (messageToEdit && messageToEdit.isUser) {
      setEditMessageModal({
        isOpen: true,
        messageId: messageId,
        content: messageToEdit.content
      });
    }
  };

  const handleEditMessageSubmit = async (newContent: string) => {
    if (!editMessageModal.messageId || !conversationId) return;

    setIsEditingMessage(true);
    try {
      // Call the API to edit the message and create a new branch
      const response = await apiService.editMessage(editMessageModal.messageId, newContent);
      
      // Navigate to the new conversation (the conversation_id from response)
      if (response.conversation_id && response.conversation_id !== conversationId) {
        navigate(`/conversation/${response.conversation_id}`);
      } else {
        // Refresh the current conversation to load the new branch
        await loadConversation(conversationId);
      }
      
      // Show success feedback
      console.log('Message edited successfully, new branch created:', response.new_branch_id);
      
      // Trigger sidebar refresh to show updated conversation
      setSidebarRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsEditingMessage(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditMessageModal({isOpen: false, messageId: '', content: ''});
  };

  const handleShowBranches = (messageId: string) => {
    // TODO: Implement branch viewer/selector modal
    console.log('Show branches for message:', messageId);
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
                    
                    return messages.map((message, index) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        conversationImages={allImages}
                        onAddDocumentToContext={handleAddDocumentToContext}
                        onRemoveDocumentFromContext={handleRemoveDocumentFromContext}
                        selectedDocuments={selectedDocuments}
                        nextMessage={index < messages.length - 1 ? messages[index + 1] : undefined}
                        onEditMessage={handleEditMessage}
                        onShowBranches={handleShowBranches}
                        categoryName={currentConversationCategoryName}
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
                      {/* Show answering indicator when reset or answer is empty */}
                      {streamingPhase === 'answering' && (
                        <AnsweringIndicator />
                      )}
                      {/* Show streaming answer for both ChatOpenAI and React Agent */}
                      {streamingPhase === 'answer' && (currentStreamContent || currentChartContent.length > 0) && (
                        <div className="flex items-start space-x-3 py-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <span className="text-sm">🤖</span>
                          </div>
                          <div className="flex-1 max-w-4xl">
                            {/* Show charts if we have chart content */}
                            {currentChartContent.length > 0 && (
                              <div className="space-y-4 mb-4">
                                {currentChartContent.map((chart, index) => (
                                  <PlotlyChart key={index} data={chart} />
                                ))}
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
                              <span>{getDisplayNameForModel(selectedModel)}</span>
                              {currentChartContent.length > 0 && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{currentChartContent.length > 1 ? `${currentChartContent.length} Charts` : 'Chart'}</span>
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

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={editMessageModal.isOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditMessageSubmit}
        originalContent={editMessageModal.content}
        isLoading={isEditingMessage}
      />
    </div>
  );
};

export default Chat;
