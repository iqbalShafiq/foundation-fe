import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { MessageCircle, ChevronLeft, Activity, DollarSign, Clock, Bot, ExternalLink } from 'lucide-react';
import { apiService } from '../../services/api';
import { DailyConversationBreakdown, ConversationTokenStats, DailyTokenStats } from '../../types/tokens';

interface ConversationTokenBreakdownProps {
  date: string;
  dayStats?: DailyTokenStats;
  onBack: () => void;
  onConversationClick?: (conversationId: string) => void;
}

const ConversationTokenBreakdown: React.FC<ConversationTokenBreakdownProps> = ({ 
  date, 
  dayStats, 
  onBack,
  onConversationClick 
}) => {
  const [data, setData] = useState<DailyConversationBreakdown | null>(null);
  const [computedDayStats, setComputedDayStats] = useState<DailyTokenStats | null>(dayStats || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversationStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getConversationTokenStats(date);
        setData(response);
        
        // If dayStats not provided (e.g., from URL refresh), compute it from conversation stats
        if (!dayStats && response.conversation_stats.length > 0) {
          const computed: DailyTokenStats = {
            date: response.date,
            input_tokens: response.conversation_stats.reduce((sum, conv) => sum + conv.input_tokens, 0),
            output_tokens: response.conversation_stats.reduce((sum, conv) => sum + conv.output_tokens, 0),
            total_tokens: response.conversation_stats.reduce((sum, conv) => sum + conv.total_tokens, 0),
            total_cost: response.conversation_stats.reduce((sum, conv) => sum + conv.total_cost, 0),
            message_count: response.conversation_stats.reduce((sum, conv) => sum + conv.message_count, 0),
            conversation_count: response.total_conversations
          };
          setComputedDayStats(computed);
        }
      } catch (err) {
        setError('Failed to load conversation breakdown');
        console.error('Error fetching conversation stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationStats();
  }, [date, dayStats]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModelBadgeColor = (modelType: string): string => {
    switch (modelType.toLowerCase()) {
      case 'standard':
        return 'bg-blue-900/30 text-blue-400';
      case 'pro':
        return 'bg-purple-900/30 text-purple-400';
      case 'premium':
        return 'bg-yellow-900/30 text-yellow-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getTruncatedTitle = (title: string, maxLength: number = 50): string => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Conversation Breakdown</h2>
              <p className="text-gray-400">Loading conversations for {formatDate(date)}...</p>
            </div>
          </div>
        </div>
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Conversation Breakdown</h2>
              <p className="text-gray-400">Conversations for {formatDate(date)}</p>
            </div>
          </div>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">
              <MessageCircle className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-gray-400">{error || 'No conversation data available'}</p>
            <p className="text-sm text-gray-500 mt-2">This might be a day with no chat activity.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Conversation Breakdown</h2>
            <p className="text-gray-400">{formatDate(date)} • {data.total_conversations} conversations</p>
          </div>
        </div>
      </div>

      {/* Day Summary */}
      {computedDayStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-100">
                  {formatNumber(computedDayStats.total_tokens)}
                </div>
                <div className="text-xs text-gray-400">Total Tokens</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-100">
                  {formatCurrency(computedDayStats.total_cost)}
                </div>
                <div className="text-xs text-gray-400">Total Cost</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <MessageCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-100">
                  {formatNumber(computedDayStats.message_count)}
                </div>
                <div className="text-xs text-gray-400">Messages</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <MessageCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-100">
                  {formatNumber(computedDayStats.conversation_count)}
                </div>
                <div className="text-xs text-gray-400">Conversations</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Conversation List */}
      <Card>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-100">Individual Conversations</h4>
          
          <div className="space-y-3">
            {data.conversation_stats.map((conversation) => (
              <div 
                key={conversation.conversation_id}
                className="flex items-start justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group"
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="font-medium text-gray-100 truncate">
                        {getTruncatedTitle(conversation.conversation_title)}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getModelBadgeColor(conversation.model_type)}`}>
                        {conversation.model_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center space-x-4">
                      <span>{formatNumber(conversation.message_count)} messages</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(conversation.last_message_at)}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(conversation.input_tokens)} input • {formatNumber(conversation.output_tokens)} output
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-right">
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {formatNumber(conversation.total_tokens)}
                    </div>
                    <div className="text-xs text-gray-400">tokens</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {formatCurrency(conversation.total_cost)}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${(conversation.total_cost / (conversation.message_count || 1)).toFixed(4)}/msg
                    </div>
                  </div>
                  {onConversationClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConversationClick(conversation.conversation_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Statistics Summary */}
          {computedDayStats && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-100">
                    {Math.round(computedDayStats.total_tokens / computedDayStats.conversation_count)}
                  </div>
                  <div className="text-xs text-gray-400">Avg tokens/conversation</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-100">
                    {Math.round(computedDayStats.message_count / computedDayStats.conversation_count)}
                  </div>
                  <div className="text-xs text-gray-400">Avg messages/conversation</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-100">
                    {formatCurrency(computedDayStats.total_cost / computedDayStats.conversation_count)}
                  </div>
                  <div className="text-xs text-gray-400">Avg cost/conversation</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-100">
                    {Math.round((computedDayStats.output_tokens / computedDayStats.input_tokens) * 100)}%
                  </div>
                  <div className="text-xs text-gray-400">Output/Input ratio</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Insights */}
      <Card>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-100">Conversation Insights</h4>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Model types</strong> indicate the AI model used for each conversation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Cost per message</strong> varies based on conversation complexity and model</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Output/Input ratio</strong> shows how much the AI generated vs. your input</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Higher token counts usually mean more detailed or technical discussions</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConversationTokenBreakdown;