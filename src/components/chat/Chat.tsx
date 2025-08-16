import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChatMessage as ChatMessageType, ModelType } from "../../types/chat";
import { apiService } from "../../services/api";
import { modelStorage } from "../../utils/modelStorage";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput, { ChatInputRef } from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import ConversationSidebar from "./ConversationSidebar";
import AllConversations from "./AllConversations";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>(() => modelStorage.load("Standard"));
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string>("");
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [currentView, setCurrentView] = useState<'chat' | 'all-conversations'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamContent]);

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
        handleNewConversation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentConversationId]);

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Clean up content to fix list spacing issues
  const cleanContent = (content: string) => {
    // Fix numbered lists: replace \n\n after numbered items with just \n
    return content.replace(/(\d+\.\s.*?)\n\n/g, '$1\n');
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: generateMessageId(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setCurrentStreamContent("");

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
        currentConversationId
      )) {
        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (chunk.content) {
          fullContent += chunk.content;
          setCurrentStreamContent(fullContent);
        }

        if (chunk.conversation_id && !receivedConversationId) {
          receivedConversationId = chunk.conversation_id;
          setCurrentConversationId(receivedConversationId);
        }

        if (chunk.done) {
          assistantMessage.content = fullContent;
          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentStreamContent("");
          
          // Trigger sidebar refresh after conversation is completed (only for new conversations)
          if (wasNewConversation && receivedConversationId) {
            setSidebarRefreshTrigger(prev => prev + 1);
          }
          
          // Fetch updated conversation to get message IDs for feedback
          if (receivedConversationId) {
            try {
              const conversationDetail = await apiService.getConversationDetail(receivedConversationId);
              
              // Update conversation title if it's a new conversation
              if (wasNewConversation) {
                setCurrentConversationTitle(conversationDetail.title);
              }
              
              const updatedMessages: ChatMessageType[] = conversationDetail.messages.map((msg) => ({
                id: msg.id.toString(),
                content: msg.content,
                isUser: msg.role === 'user',
                timestamp: new Date(msg.created_at),
                model: msg.role === 'assistant' ? conversationDetail.model_type as ModelType : undefined,
                messageId: msg.role === 'assistant' ? msg.id : undefined,
              }));
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
    } finally {
      setIsStreaming(false);
      // Focus back to input after streaming is complete
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setCurrentStreamContent("");
    setCurrentView('chat'); // Switch to chat view when selecting a conversation
    
    try {
      // Load conversation details with message history
      const conversationDetail = await apiService.getConversationDetail(conversationId);
      
      // Set conversation title
      setCurrentConversationTitle(conversationDetail.title);
      
      // Convert backend messages to frontend format
      const loadedMessages: ChatMessageType[] = conversationDetail.messages.map((msg) => ({
        id: msg.id.toString(),
        content: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
        model: msg.role === 'assistant' ? conversationDetail.model_type as ModelType : undefined,
        messageId: msg.role === 'assistant' ? msg.id : undefined, // Add messageId for AI messages
      }));
      
      setMessages(loadedMessages);
      
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

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
    setCurrentConversationTitle("");
    setMessages([]);
    setCurrentStreamContent("");
    setCurrentView('chat'); // Switch to chat view when starting new conversation
    
    // Focus input when starting new conversation
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleShowAllConversations = () => {
    setCurrentView('all-conversations');
  };

  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
    modelStorage.save(model);
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
                      <span className="text-3xl">💬</span>
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
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {isStreaming && (
                    <>
                      {currentStreamContent ? (
                        <div className="flex items-start space-x-3 py-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <span className="text-sm">🤖</span>
                          </div>
                          <div className="flex-1 max-w-3xl">
                            <div className="inline-block px-5 py-3 bg-gray-700 rounded-2xl rounded-tl-md shadow-md">
                              <div className="prose prose-sm max-w-none break-words text-gray-100">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight]}
                                  components={{
                                    p: ({ children, node }) => {
                                      // Check if this paragraph is inside a list item
                                      const isInListItem = node?.parent?.tagName === 'li';
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
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              <span>
                                {new Date().toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="mx-1">•</span>
                              <span>{selectedModel}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
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
          />
        </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
