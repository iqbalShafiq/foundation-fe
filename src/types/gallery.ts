export interface ImageItem {
  url: string;
  message_id: number;
  conversation_id: string;
  created_at: string;
  message_content: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GalleryResponse {
  data: ImageItem[];
  pagination: PaginationMetadata;
}