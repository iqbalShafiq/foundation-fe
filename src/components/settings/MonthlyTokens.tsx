import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import { CreditCard, Calendar, TrendingUp, Activity, DollarSign, ChevronDown, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { MonthlyTokenStats, DailyTokenStats } from '../../types/tokens';
import { User } from '../../types/auth';
import DailyTokenBreakdown from './DailyTokenBreakdown';
import ConversationTokenBreakdown from './ConversationTokenBreakdown';

type ViewMode = 'monthly' | 'daily' | 'conversations';

interface DrillDownState {
  year: number;
  month: number;
  monthName: string;
  date?: string;
  dayStats?: DailyTokenStats;
}

const MonthlyTokens: React.FC = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [drillDownState, setDrillDownState] = useState<DrillDownState | null>(null);

  const fetchTokenData = async (monthsLimit: number = 12, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      setLoadingMore(append);

      const response = await apiService.getCurrentUser({
        limit: monthsLimit,
        include_token_stats: true
      });
      
      if (append && userData?.token_stats) {
        // Append new data when loading more
        setUserData({
          ...response,
          token_stats: {
            ...response.token_stats!,
            monthly_stats: [
              ...userData.token_stats.monthly_stats,
              ...response.token_stats!.monthly_stats
            ]
          }
        });
      } else {
        setUserData(response);
      }
    } catch (err) {
      setError('Failed to load monthly token data');
      console.error('Error fetching token data:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTokenData(limit);
  }, []);

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

  const loadMore = async () => {
    const newLimit = limit + 12;
    setLimit(newLimit);
    await fetchTokenData(newLimit, true);
  };

  const getCurrentMonthStats = (): MonthlyTokenStats | null => {
    if (!userData?.token_stats?.monthly_stats.length) return null;
    return userData.token_stats.monthly_stats[0]; // Assuming first is current month
  };

  const getTotalStats = () => {
    if (!userData?.token_stats?.monthly_stats.length) return null;

    const stats = userData.token_stats.monthly_stats;
    return {
      total_tokens: stats.reduce((sum, stat) => sum + stat.total_tokens, 0),
      total_cost: stats.reduce((sum, stat) => sum + stat.total_cost, 0),
      total_messages: stats.reduce((sum, stat) => sum + stat.message_count, 0),
      avg_tokens_per_message: stats.length > 0 
        ? Math.round(stats.reduce((sum, stat) => sum + stat.total_tokens, 0) / 
                    stats.reduce((sum, stat) => sum + stat.message_count, 0))
        : 0
    };
  };

  const parseMonthString = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    return { year: parseInt(year), month: parseInt(month), monthName };
  };

  const handleMonthClick = (monthStat: MonthlyTokenStats) => {
    const { year, month, monthName } = parseMonthString(monthStat.month);
    setDrillDownState({ year, month, monthName });
    setViewMode('daily');
  };

  const handleDayClick = (date: string, dayStats: DailyTokenStats) => {
    if (drillDownState) {
      setDrillDownState({ ...drillDownState, date, dayStats });
      setViewMode('conversations');
    }
  };

  const handleBackToMonthly = () => {
    setViewMode('monthly');
    setDrillDownState(null);
  };

  const handleBackToDaily = () => {
    setViewMode('daily');
    if (drillDownState) {
      setDrillDownState({ ...drillDownState, date: undefined, dayStats: undefined });
    }
  };

  const handleConversationClick = (conversationId: string) => {
    window.open(`/chat/${conversationId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Monthly Tokens</h2>
            <p className="text-gray-400">Loading token usage information...</p>
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

  if (error || !userData?.token_stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Monthly Tokens</h2>
            <p className="text-gray-400">View your monthly token usage and costs</p>
          </div>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">
              <CreditCard className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-gray-400">{error || 'No token usage data available'}</p>
            <p className="text-sm text-gray-500 mt-2">Start chatting to see your usage statistics!</p>
          </div>
        </Card>
      </div>
    );
  }

  const currentMonth = getCurrentMonthStats();
  const totalStats = getTotalStats();

  // Render drill-down views
  if (viewMode === 'daily' && drillDownState) {
    return (
      <DailyTokenBreakdown
        year={drillDownState.year}
        month={drillDownState.month}
        monthName={drillDownState.monthName}
        onBack={handleBackToMonthly}
        onDayClick={handleDayClick}
      />
    );
  }

  if (viewMode === 'conversations' && drillDownState?.date && drillDownState?.dayStats) {
    return (
      <ConversationTokenBreakdown
        date={drillDownState.date}
        dayStats={drillDownState.dayStats}
        onBack={handleBackToDaily}
        onConversationClick={handleConversationClick}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <CreditCard className="h-6 w-6 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Monthly Tokens</h2>
          <p className="text-gray-400">View your monthly token usage and costs</p>
        </div>
      </div>

      {/* Current Month Overview */}
      {currentMonth && (
        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {currentMonth.month}
                  </h3>
                  <p className="text-sm text-gray-400">Current month</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-100">
                  {formatCurrency(currentMonth.total_cost)}
                </div>
                <div className="text-sm text-gray-400">Total cost</div>
              </div>
            </div>

            {/* Current Month Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-gray-100">
                  {formatNumber(currentMonth.total_tokens)}
                </div>
                <div className="text-sm text-gray-400">Total Tokens</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(currentMonth.input_tokens)}
                </div>
                <div className="text-sm text-gray-400">Input Tokens</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-purple-400">
                  {formatNumber(currentMonth.output_tokens)}
                </div>
                <div className="text-sm text-gray-400">Output Tokens</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(currentMonth.message_count)}
                </div>
                <div className="text-sm text-gray-400">Messages</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Overall Statistics */}
      {totalStats && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-100">
                  {formatNumber(totalStats.total_tokens)}
                </div>
                <div className="text-sm text-gray-400">Total Tokens • All time</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-100">
                  {formatCurrency(totalStats.total_cost)}
                </div>
                <div className="text-sm text-gray-400">Total Cost • All time</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-100">
                  {formatNumber(totalStats.total_messages)}
                </div>
                <div className="text-sm text-gray-400">Total Messages • All time</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <Activity className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-100">
                  {formatNumber(totalStats.avg_tokens_per_message)}
                </div>
                <div className="text-sm text-gray-400">Avg Tokens/Msg • All time</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Monthly Breakdown */}
      <Card>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-100">Monthly Breakdown</h4>
          
          <div className="space-y-3">
            {userData.token_stats.monthly_stats.map((monthStat, index) => (
              <div 
                key={monthStat.month} 
                onClick={() => handleMonthClick(monthStat)}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-100">{monthStat.month}</div>
                    <div className="text-sm text-gray-400">
                      {formatNumber(monthStat.message_count)} messages
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {formatNumber(monthStat.total_tokens)} tokens
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatNumber(monthStat.input_tokens)} in / {formatNumber(monthStat.output_tokens)} out
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {formatCurrency(monthStat.total_cost)}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${(monthStat.total_cost / (monthStat.message_count || 1)).toFixed(4)}/msg
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {userData.token_stats.has_more && (
            <div className="text-center pt-4 border-t border-gray-700">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Load More ({userData.token_stats.total_months - userData.token_stats.monthly_stats.length} more)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Tips */}
      <Card>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-100">Understanding Your Usage</h4>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Click any month</strong> to see daily breakdown and drill down further</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Input tokens</strong> are counted from your messages and context</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Output tokens</strong> are generated responses from the AI</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><strong className="text-gray-300">Costs</strong> are calculated based on token usage and model pricing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>View individual conversation breakdowns by drilling down to daily level</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Usage statistics help you understand and optimize your usage patterns</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MonthlyTokens;