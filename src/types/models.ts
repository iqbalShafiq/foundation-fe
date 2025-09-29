// Model Management Types
export interface Model {
  id: string;
  canonical_slug: string;
  hugging_face_id: string;
  name: string;
  description: string;
  context_length: number;
  modality: string;
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type: string | null;
  prompt_price: number;      // Cost per token (not per 1M tokens)
  completion_price: number;  // Cost per token (not per 1M tokens)
  request_price: number;
  image_price: number;
  web_search_price: number;
  internal_reasoning_price: number;
  input_cache_read_price: number | null;
  provider_context_length: number;
  max_completion_tokens: number | null;
  is_moderated: boolean;
  supported_parameters: string[];
  per_request_limits: any | null;
  is_active: boolean;
  last_updated: string;
  created_at: string;
}

// Helper functions for Model interface
export const getModelProvider = (model: Model): string => {
  return model.name.split(':')[0] || 'Unknown';
};

export const getModelInputCostPer1M = (model: Model): number => {
  return model.prompt_price * 1000000; // Convert per token to per 1M tokens
};

export const getModelOutputCostPer1M = (model: Model): number => {
  return model.completion_price * 1000000; // Convert per token to per 1M tokens
};

export interface ModelSearchParams {
  query?: string;
  provider?: string;
  modality?: string[];
  min_context_length?: number;
  max_context_length?: number;
  min_cost?: number;
  max_cost?: number;
  limit?: number;
  offset?: number;
}

export interface ModelSearchResponse {
  models: Model[];
  total: number;
  limit: number;
  offset: number;
}

export interface ModelPricingComparison {
  model_id: string;
  model_name: string;
  provider: string;
  input_cost: number;
  output_cost: number;
  context_length: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
}

export interface ModelCapabilitiesSummary {
  total_models: number;
  providers: string[];
  modalities: string[];
  context_length_range: {
    min: number;
    max: number;
  };
  cost_range: {
    input_min: number;
    input_max: number;
    output_min: number;
    output_max: number;
  };
}

// User Model Categories
export interface UserModelCategory {
  id: number;
  category_name: string;
  display_name: string;
  model_id: string;
  model_name: string;
  model_pricing: {
    prompt_price: number;      // Cost per input token
    completion_price: number;  // Cost per output token
    request_price: number;
    context_length: number;
  };
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to determine if a category is custom (not one of the 4 defaults)
export const isCustomCategory = (category: UserModelCategory): boolean => {
  const defaultCategories = ['FAST', 'STANDARD', 'FAST_REASONING', 'REASONING'];
  return !defaultCategories.includes(category.category_name);
};

export interface CreateUserModelCategoryRequest {
  category_name: string;
  display_name: string;
  model_id: string;
}

export interface UpdateUserModelCategoryRequest {
  model_id: string;
}

export interface ModelPricingInfo {
  category_name: string;
  model_id: string;
  model_name: string;
  provider: string;
  input_cost: number;  // Cost per 1M tokens
  output_cost: number; // Cost per 1M tokens
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  context_length: number;
  max_output: number;
}

export interface CostEstimationRequest {
  model_id: string;
  prompt_tokens: number;
  max_completion_tokens?: number;
}

export interface CostEstimationResponse {
  model_id: string;
  model_name: string;
  estimated_input_cost: number;
  estimated_output_cost: number;
  estimated_total_cost: number;
  prompt_tokens: number;
  estimated_completion_tokens: number;
  cost_breakdown: {
    input_cost_per_token: number;
    output_cost_per_token: number;
  };
}

// Update existing ModelType to support custom categories
export type ModelType = 'Fast' | 'Standard' | 'Fast Reasoning' | 'Reasoning' | string;