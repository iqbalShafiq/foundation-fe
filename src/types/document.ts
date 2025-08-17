export type DocumentStatus = 'processing' | 'completed' | 'failed';

export type Document = {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  processing_status: DocumentStatus;
  chunk_count: number;
  error_message?: string | null;
  document_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentChunk = {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, any>;
  created_at: string;
};

export type DocumentCollection = {
  id: string;
  name: string;
  description?: string;
  document_ids: string[];
  documents?: Document[];
  created_at: string;
  updated_at: string;
};

export type DocumentUploadResponse = {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  processing_status: DocumentStatus;
  chunk_count: number;
  error_message?: string | null;
  document_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentSearchRequest = {
  query: string;
  document_ids?: string[];
  limit?: number;
  threshold?: number;
};

export type DocumentSearchResult = {
  chunk_id: string;
  document_id: string;
  document_name: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
};

export type DocumentSearchResponse = {
  results: DocumentSearchResult[];
  total_results: number;
};

export type ContextSource = {
  document_id: string;
  document_name: string;
  page_number?: number;
  relevance_score: number;
};

export type ChatRequest = {
  message: string;
  model?: string;
  conversation_id?: string;
  document_contexts?: string[];
  context_collection?: string;
  max_context_chunks?: number;
  context_relevance_threshold?: number;
};

export type ChatStreamResponse = {
  content: string;
  done: boolean;
  error?: string;
  conversation_id?: string;
  context_sources?: ContextSource[];
};