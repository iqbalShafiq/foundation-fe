import axios, { AxiosInstance } from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { ModelType, Conversation, ConversationDetail, FeedbackCreate, FeedbackResponse } from '../types/chat';
import { UserPreferences, UserPreferencesUpdate } from '../types/preferences';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          // Only redirect to login if we're not already on login/register pages
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
        throw error;
      }
    );
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await this.api.post<User>('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.api.get('/conversations');
    return response.data.data || response.data;
  }

  async getConversationsPaginated(page: number = 1, limit: number = 20, keyword?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (keyword) {
      params.append('keyword', keyword);
    }
    
    const response = await this.api.get(`/conversations?${params.toString()}`);
    return response.data;
  }

  async searchConversations(keyword: string): Promise<Conversation[]> {
    const response = await this.api.get(`/conversations?keyword=${encodeURIComponent(keyword)}`);
    return response.data.data || response.data;
  }

  async getConversationDetail(conversationId: string): Promise<ConversationDetail> {
    const response = await this.api.get<ConversationDetail>(`/conversations/${conversationId}`);
    return response.data;
  }

  async* streamChat(message: string, model: ModelType = 'Standard', conversationId?: string) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ 
        message, 
        model, 
        conversation_id: conversationId 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
              
              if (data.done) return;
              if (data.error) throw new Error(data.error);
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async createFeedback(feedback: FeedbackCreate): Promise<FeedbackResponse> {
    const response = await this.api.post<FeedbackResponse>('/feedback/', feedback);
    return response.data;
  }

  async getMessageFeedback(messageId: number): Promise<FeedbackResponse[]> {
    const response = await this.api.get<FeedbackResponse[]>(`/feedback/message/${messageId}`);
    return response.data;
  }

  async deleteFeedback(feedbackId: number): Promise<void> {
    await this.api.delete(`/feedback/${feedbackId}`);
  }

  async getUserPreferences(): Promise<UserPreferences> {
    const response = await this.api.get<UserPreferences>('/preferences');
    return response.data;
  }

  async updateUserPreferences(preferences: UserPreferencesUpdate): Promise<UserPreferences> {
    const response = await this.api.put<UserPreferences>('/preferences', preferences);
    return response.data;
  }
}

export const apiService = new ApiService();