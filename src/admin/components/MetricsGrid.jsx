import React, { useState, useEffect } from 'react';
import { adminQueries } from '../services/adminQueries.js';

// Tooltip component for metric explanations
const InfoTooltip = ({ title, description, calculation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-300 transition-colors ml-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 shadow-xl z-50">
          <div className="font-semibold text-white mb-2">{title}</div>
          <div className="mb-2">{description}</div>
          <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
            <span className="font-medium">Calculation:</span> {calculation}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricsGrid = ({ timeRange }) => {
  const [metrics, setMetrics] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadRealTimeStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [funnelData, userInsights, businessData, visitData] = await Promise.all([
        adminQueries.getFunnelMetrics(timeRange),
        adminQueries.getUserInsights(),
        adminQueries.getBusinessIntelligence(),
        adminQueries.getVisitAnalytics(timeRange)
      ]);

      setMetrics({
        funnel: funnelData,
        users: userInsights,
        business: businessData,
        visits: visitData
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeStats = async () => {
    try {
      const stats = await adminQueries.getRealTimeStats();
      setRealTimeStats(stats);
    } catch (error) {
      console.error('Error loading real-time stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Landing Page Visits',
      value: metrics?.visits?.totalVisits || 0,
      change: `${metrics?.visits?.conversionRate || 0}% convert`,
      changeType: metrics?.visits?.conversionRate > 10 ? 'positive' : 'negative',
      icon: '👁️',
      subtitle: `${timeRange} period`,
      description: 'Total number of visitors who landed on the test page, tracked immediately with UTM parameters.',
      calculation: 'Count of records in ai_level_visits table. Includes all visitors regardless of completion'
    },
    {
      title: 'Test Starts',
      value: metrics?.funnel?.testStarts || 0,
      change: '+12%',
      changeType: 'positive',
      icon: '🚀',
      subtitle: `${timeRange} period`,
      description: 'Total number of users who initiated the AI Level Test by clicking "Take the test" button.',
      calculation: 'Count of test_started analytics events within the selected time range'
    },
    {
      title: 'Completions', 
      value: metrics?.funnel?.completions || 0,
      change: `${metrics?.funnel?.conversionRate || 0}% rate`,
      changeType: 'neutral',
      icon: '✅',
      subtitle: 'Test to lead',
      description: 'Number of users who completed the entire 6-question assessment and reached the results screen.',
      calculation: 'Count of records in ai_level_leads table within time range. Conversion rate = (completions ÷ test starts) × 100'
    },
    {
      title: 'Product Interest',
      value: metrics?.funnel?.productInterests || 0,
      change: `${metrics?.funnel?.leadToIntentRate || 0}% of leads`,
      changeType: metrics?.funnel?.leadToIntentRate > 30 ? 'positive' : 'negative',
      icon: '💎',
      subtitle: 'Conversion intent',
      description: 'Users who clicked "Reserve my spot" on either product offering. Shows breakdown: Assessment (prove your level) vs Learning Path (level up).',
      calculation: 'Count of records in ai_level_intents table. Rate = (product interests ÷ completions) × 100',
      breakdown: {
        prove: metrics?.funnel?.proveInterests || 0,
        improve: metrics?.funnel?.improveInterests || 0
      }
    },
    {
      title: 'Share Rate',
      value: `${metrics?.funnel?.shareRate || 0}%`,
      change: `${metrics?.funnel?.shareInitiations || 0} shares`,
      changeType: metrics?.funnel?.shareRate > 20 ? 'positive' : 'negative',
      icon: '📤',
      subtitle: 'Viral coefficient',
      description: 'Percentage of completed users who attempted to share their results via social media or messaging.',
      calculation: 'Count of share_initiated events ÷ completions × 100. Higher rates indicate better viral potential'
    },
    {
      title: 'Total Users',
      value: metrics?.users?.totalUsers || 0,
      change: 'All time',
      changeType: 'neutral',
      icon: '👥',
      subtitle: 'Registered leads',
      description: 'Total number of unique users who have completed the assessment and provided their contact information.',
      calculation: 'Total count of all records in ai_level_leads table (not filtered by time range)'
    },
    {
      title: 'Avg AI Level',
      value: metrics?.users?.levelDistribution ? 
        (Object.entries(metrics.users.levelDistribution)
          .reduce((sum, [level, count]) => sum + (parseInt(level) || 4) * count, 0) / 
         Object.values(metrics.users.levelDistribution)
          .reduce((sum, count) => sum + count, 0)).toFixed(1) : '0',
      change: 'Average score',
      changeType: 'neutral',
      icon: '🎯',
      subtitle: 'User proficiency',
      description: 'Average AI proficiency level across all users. Scale: 0 (Non-User) to 4+ (AI-Native Performer).',
      calculation: 'Sum of (AI level × user count) ÷ total users. Level 4+ users are counted as 4 for calculation'
    },
    {
      title: 'Lead Quality',
      value: metrics?.business?.leadQuality?.average || 0,
      change: 'Quality score',
      changeType: metrics?.business?.leadQuality?.average > 60 ? 'positive' : 'negative',
      icon: '⭐',
      subtitle: 'Out of 100',
      description: 'Composite score measuring lead value based on AI level, relationship status, and product interest.',
      calculation: 'AI Level × 20 + Relationship Score (5-25) + Product Interest Bonus (30) + Max cap at 100'
    }
  ];

  return (
    <div>
      {/* Real-time activity bar */}
      {realTimeStats && (
        <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-400 font-medium">Live Activity</span>
            </div>
            <div className="text-sm text-gray-400">
              {realTimeStats.activeUsers} active users • {realTimeStats.recentEvents.length} recent events
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <div
            key={index}
            className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                {metric.icon}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                metric.changeType === 'positive' 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : metric.changeType === 'negative'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}>
                {metric.change}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{metric.title}</p>
                <InfoTooltip 
                  title={metric.title}
                  description={metric.description}
                  calculation={metric.calculation}
                />
              </div>
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              
              {/* Product breakdown for Product Interest card */}
              {metric.breakdown && (
                <div className="text-xs text-gray-400 space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span>Assessment:</span>
                    <span className="text-blue-400 font-medium">{metric.breakdown.prove}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Learning Path:</span>
                    <span className="text-purple-400 font-medium">{metric.breakdown.improve}</span>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">{metric.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-all duration-200 border border-blue-500/20 hover:border-blue-500/30">
          Export Data
        </button>
        <button className="px-4 py-2 bg-gray-800/60 hover:bg-gray-800/80 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200">
          Refresh
        </button>
        <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium transition-all duration-200 border border-purple-500/20 hover:border-purple-500/30">
          Settings
        </button>
      </div>
    </div>
  );
};

export default MetricsGrid;