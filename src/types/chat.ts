export type ModelType = 'Fast' | 'Standard' | 'Fast Reasoning' | 'Reasoning';

export type ChatRequest = {
  message: string;
  model: ModelType;
  conversation_id?: string;
  document_contexts?: string[];
  context_collection?: string;
  max_context_chunks?: number;
  context_relevance_threshold?: number;
};

export type ChatMessage = {
  id: string;
  content: string;
  type?: 'text' | 'chart'; // Message type for different content rendering
  isUser: boolean;
  timestamp: Date;
  model?: ModelType;
  messageId?: number; // Backend message ID for feedback
  imageUrls?: string[]; // URLs of images attached to this message
  contextSources?: ContextSource[]; // Document sources used for this response
  documentContext?: DocumentContext | null; // Document context information
  thinkingContent?: string; // Thinking phase content
  reasoningContent?: string; // Reasoning summary content
  isThinking?: boolean; // Whether currently in thinking phase
  isReasoning?: boolean; // Whether currently in reasoning phase
};

export type StreamChunk = {
  type?: 'thinking' | 'reasoning' | 'answer'; // Only present for React Agent responses
  content: string;
  done: boolean;
  error?: string;
  conversation_id?: string;
  context_sources?: ContextSource[]; // Document sources from both ChatOpenAI and React Agent
};

export type ContextSource = {
  document_id: string;
  document_name: string;
  page_number?: number;
  relevance_score: number;
};

export type Conversation = {
  id: string;
  title: string;
  model_type: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  related_chats?: RelatedChat[];
};

export type DocumentContext = {
  collection_id: string;
  documents: {
    document_id: string;
    title: string;
    url: string | null;
    file_extension: string;
    document_url?: string | null;
  }[];
  context_chunks_count: number;
};

export type RelatedChat = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  document_context?: DocumentContext | null;
  created_at: string;
};

export type GroupedConversations = {
  [key: string]: Conversation[];
};

export type ChartData = {
  chart_data: any; // Plotly chart data
  chart_type: string; // Chart type (bar, line, etc.)
  description: string; // Chart description
  config: any; // Chart configuration
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  image_urls?: string[] | null;
  document_context?: DocumentContext | null;
  chart_data?: ChartData | null; // Chart data from backend
  created_at: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  model_type: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
};

export type FeedbackType = 'like' | 'dislike';

export type FeedbackCreate = {
  message_id: number;
  feedback_type: FeedbackType;
  description?: string;
};

export type FeedbackResponse = {
  id: number;
  message_id: number;
  user_id: number;
  feedback_type: FeedbackType;
  description?: string;
  created_at: string;
};