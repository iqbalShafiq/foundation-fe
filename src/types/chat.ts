export type ModelType = 'Fast' | 'Standard' | 'Fast Reasoning' | 'Reasoning';

export type ChatRequest = {
  message: string;
  model: ModelType;
  conversation_id?: string;
  category_id?: number;
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
  input_tokens?: number | null;      // Input/prompt tokens
  output_tokens?: number | null;     // Output/completion tokens  
  total_tokens?: number | null;      // Total tokens used
  model_cost?: number | null;        // Cost in USD (optional)
  // Branch feature fields
  parentMessageId?: number | null; // ID of parent message for branching
  branchId?: string | null;         // Unique branch identifier
  isActiveBranch?: boolean;        // Whether this message is part of the active branch
  hasBranches?: boolean;            // Whether this message has alternative branches
};

export type StreamChunk = {
  type?: 'thinking' | 'reasoning' | 'answer' | 'reset'; // Only present for React Agent responses
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
  category_name?: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
  related_chats?: RelatedChat[];
  parent_conversation_id?: string | null;
  is_branch?: boolean;
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
  chart_data?: ChartData | ChartData[] | null; // Chart data from backend - can be single or multiple charts
  input_tokens?: number | null;      // Input/prompt tokens
  output_tokens?: number | null;     // Output/completion tokens
  total_tokens?: number | null;      // Total tokens used
  model_cost?: number | null;        // Cost in USD (optional)
  created_at: string;
  // Branch feature fields
  parent_message_id?: number | null; // ID of parent message for branching
  branch_id?: string | null;         // Unique branch identifier
  is_active_branch?: boolean;        // Whether this message is part of the active branch
  has_branches?: boolean;            // Whether this message has alternative branches
};

export type ConversationDetail = {
  id: string;
  title: string;
  model_type: string;
  category_name?: string | null;
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

// Branch management types
export type EditMessageRequest = {
  content: string;
};

export type EditMessageResponse = {
  message_id: number;
  new_branch_id: string;
  conversation_id: string;
  regenerated_messages: Message[];
};

export type Branch = {
  branch_id: string;
  created_at: string;
  message_count: number;
  is_active: boolean;
};

export type BranchesResponse = {
  branches: Branch[];
};