import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { Calendar, ChevronLeft, Activity, DollarSign, MessageCircle, Users, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { MonthlyDailyBreakdown, DailyTokenStats } from '../../types/tokens';

interface DailyTokenBreakdownProps {
  year: number;
  month: number;
  monthName: string;
  onBack: () => void;
  onDayClick: (date: string, dayStats: DailyTokenStats) => void;
}

const DailyTokenBreakdown: React.FC<DailyTokenBreakdownProps> = ({ 
  year, 
  month, 
  monthName, 
  onBack, 
  onDayClick 
}) => {
  const [data, setData] = useState<MonthlyDailyBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDailyTokenStats(year, month);
        setData(response);
      } catch (err) {
        setError('Failed to load daily breakdown');
        console.error('Error fetching daily stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyStats();
  }, [year, month]);

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
      weekday: 'short', 
      day: 'numeric' 
    });
  };

  const getTotalStats = () => {
    if (!data?.daily_stats.length) return null;

    const stats = data.daily_stats;
    return {
      total_tokens: stats.reduce((sum, stat) => sum + stat.total_tokens, 0),
      total_cost: stats.reduce((sum, stat) => sum + stat.total_cost, 0),
      total_messages: stats.reduce((sum, stat) => sum + stat.message_count, 0),
      total_conversations: stats.reduce((sum, stat) => sum + stat.conversation_count, 0),
      avg_cost_per_day: stats.reduce((sum, stat) => sum + stat.total_cost, 0) / stats.length,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Daily Breakdown</h2>
              <p className="text-gray-400">Loading daily stats for {monthName}...</p>
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
            <Calendar className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Daily Breakdown</h2>
              <p className="text-gray-400">Daily stats for {monthName}</p>
            </div>
          </div>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">
              <Calendar className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-gray-400">{error || 'No daily data available'}</p>
            <p className="text-sm text-gray-500 mt-2">Try selecting a different month.</p>
          </div>
        </Card>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Daily Breakdown</h2>
            <p className="text-gray-400">Daily stats for {monthName} • {data.total_days} active days</p>
          </div>
        </div>
      </div>

      {/* Month Summary */}
      {totalStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-100">
                  {formatNumber(totalStats.total_tokens)}
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
                  {formatCurrency(totalStats.total_cost)}
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
                  {formatNumber(totalStats.total_messages)}
                </div>
                <div className="text-xs text-gray-400">Messages</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-100">
                  {formatNumber(totalStats.total_conversations)}
                </div>
                <div className="text-xs text-gray-400">Conversations</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Daily Breakdown */}
      <Card>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-100">Daily Activity</h4>
          
          <div className="space-y-3">
            {data.daily_stats.map((dayStat) => (
              <div 
                key={dayStat.date}
                onClick={() => onDayClick(dayStat.date, dayStat)}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-100">{formatDate(dayStat.date)}</div>
                    <div className="text-sm text-gray-400">
                      {formatNumber(dayStat.message_count)} messages • {formatNumber(dayStat.conversation_count)} conversations
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {formatNumber(dayStat.total_tokens)} tokens
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatNumber(dayStat.input_tokens)} in / {formatNumber(dayStat.output_tokens)} out
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {formatCurrency(dayStat.total_cost)}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${(dayStat.total_cost / (dayStat.message_count || 1)).toFixed(4)}/msg
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Usage Tips */}
      <Card>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-100">Daily Usage Insights</h4>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Click any day</strong> to see detailed conversation breakdowns</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Conversation count</strong> shows unique conversations you had that day</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Cost per message</strong> helps identify efficiency patterns</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Days with higher token ratios may indicate more complex conversations</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DailyTokenBreakdown;