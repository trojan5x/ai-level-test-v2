import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { adminQueries } from '../services/adminQueries.js';

// Info tooltip component
const InfoTooltip = ({ title, description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-300 transition-colors"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 shadow-xl z-50">
          <div className="font-semibold text-white mb-1">{title}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      )}
    </div>
  );
};

const ConversionFunnel = ({ timeRange, compact = false }) => {
  const [funnelData, setFunnelData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFunnelData();
  }, [timeRange]);

  const loadFunnelData = async () => {
    setIsLoading(true);
    try {
      const [funnel, timeSeries] = await Promise.all([
        adminQueries.getFunnelMetrics(timeRange),
        adminQueries.getTimeSeriesData(timeRange)
      ]);

      setFunnelData(funnel);
      setTimeSeriesData(timeSeries);
    } catch (error) {
      console.error('Error loading funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40">
        <p className="text-gray-400 text-center">No funnel data available</p>
      </div>
    );
  }

  const funnelSteps = [
    {
      name: 'Test Started',
      value: funnelData.testStarts,
      percentage: 100,
      color: '#3B82F6',
      icon: '🚀',
      description: 'Users who clicked "Take the test" and began the assessment'
    },
    {
      name: 'Completed Test',
      value: funnelData.completions,
      percentage: funnelData.testStarts > 0 ? (funnelData.completions / funnelData.testStarts * 100) : 0,
      color: '#10B981',
      icon: '✅',
      description: 'Users who answered all 6 questions and reached the results screen'
    },
    {
      name: 'Product Interest',
      value: funnelData.productInterests,
      percentage: funnelData.testStarts > 0 ? (funnelData.productInterests / funnelData.testStarts * 100) : 0,
      color: '#8B5CF6',
      icon: '💎',
      description: 'Users who clicked "Reserve my spot" on product offerings'
    },
    {
      name: 'Shared Results',
      value: funnelData.shareInitiations,
      percentage: funnelData.testStarts > 0 ? (funnelData.shareInitiations / funnelData.testStarts * 100) : 0,
      color: '#F59E0B',
      icon: '📤',
      description: 'Users who initiated sharing their results to social media or messaging apps'
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{`${label}: ${payload[0].value}`}</p>
          <p className="text-gray-400 text-sm">{`Date: ${label}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Conversion Funnel</h2>
          <p className="text-gray-400 text-sm">User journey through the assessment</p>
        </div>
        <div className="text-sm text-gray-500">
          {timeRange === '24h' ? 'Last 24 Hours' : 
           timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="mb-8">
        <div className="space-y-4">
          {funnelSteps.map((step, index) => (
            <div key={step.name} className="relative">
              {/* Connection line to next step */}
              {index < funnelSteps.length - 1 && (
                <div className="absolute left-8 top-16 w-px h-4 bg-gray-700"></div>
              )}
              
              <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all duration-200">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: step.color }}
                >
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h3 className="font-medium text-white">{step.name}</h3>
                      <InfoTooltip 
                        title={step.name}
                        description={step.description}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{step.value.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">{step.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${step.percentage}%`, 
                        backgroundColor: step.color 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-400">Test → Lead</div>
            <InfoTooltip 
              title="Test to Lead Conversion"
              description="Percentage of users who started the test and completed it to become a lead"
            />
          </div>
          <div className="text-2xl font-bold text-green-400">{funnelData.conversionRate}%</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-400">Lead → Intent</div>
            <InfoTooltip 
              title="Lead to Intent Conversion"
              description="Percentage of leads who showed interest in purchasing a product"
            />
          </div>
          <div className="text-2xl font-bold text-purple-400">{funnelData.leadToIntentRate}%</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-400">Share Rate</div>
            <InfoTooltip 
              title="Viral Share Rate"
              description="Percentage of completed users who shared their results, indicating viral potential"
            />
          </div>
          <div className="text-2xl font-bold text-amber-400">{funnelData.shareRate}%</div>
        </div>
      </div>

      {/* Time Series Chart (only show if not compact) */}
      {!compact && timeSeriesData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Trend Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="test_started" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Test Started"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="lead_captured" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Leads"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="share_initiated" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Shares"
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionFunnel;