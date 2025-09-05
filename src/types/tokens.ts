export interface MonthlyTokenStats {
  month: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
  message_count: number;
}

export interface TokenStats {
  monthly_stats: MonthlyTokenStats[];
  total_months: number;
  has_more: boolean;
}

export interface DailyTokenStats {
  date: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
  message_count: number;
  conversation_count: number;
}

export interface MonthlyDailyBreakdown {
  month: string;
  daily_stats: DailyTokenStats[];
  total_days: number;
}

export interface ConversationTokenStats {
  conversation_id: string;
  conversation_title: string;
  model_type: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
  message_count: number;
  last_message_at: string;
}

export interface DailyConversationBreakdown {
  date: string;
  conversation_stats: ConversationTokenStats[];
  total_conversations: number;
}