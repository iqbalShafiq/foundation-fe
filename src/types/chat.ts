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
  isUser: boolean;
  timestamp: Date;
  model?: ModelType;
  messageId?: number; // Backend message ID for feedback
  imageUrls?: string[]; // URLs of images attached to this message
  contextSources?: ContextSource[]; // Document sources used for this response
};

export type StreamChunk = {
  content: string;
  done: boolean;
  error?: string;
  conversation_id?: string;
  context_sources?: ContextSource[];
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

export type RelatedChat = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type GroupedConversations = {
  [key: string]: Conversation[];
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  image_urls?: string[];
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