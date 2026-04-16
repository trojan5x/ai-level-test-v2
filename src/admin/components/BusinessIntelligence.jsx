import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { adminQueries } from '../services/adminQueries.js';

const BusinessIntelligence = ({ timeRange, compact = false }) => {
  const [businessData, setBusinessData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBusinessData();
  }, [timeRange]);

  const loadBusinessData = async () => {
    setIsLoading(true);
    try {
      const data = await adminQueries.getBusinessIntelligence();
      setBusinessData(data);
    } catch (error) {
      console.error('Error loading business intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40">
        <p className="text-gray-400 text-center">No business intelligence data available</p>
      </div>
    );
  }

  // Prepare revenue breakdown data for charts
  const revenueBreakdown = Object.entries(businessData.revenueEstimates?.breakdown || {}).map(([level, amount]) => ({
    level: `Level ${level}`,
    revenue: amount,
    formatted: `$${amount.toLocaleString()}`
  }));

  const leadQualityData = [
    { quality: 'High Quality', count: businessData.leadQuality?.high || 0, color: '#22C55E' },
    { quality: 'Medium Quality', count: businessData.leadQuality?.medium || 0, color: '#EAB308' },
    { quality: 'Low Quality', count: businessData.leadQuality?.low || 0, color: '#EF4444' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-gray-300">{`${data.name}: ${data.payload.formatted || data.value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header with Key Metrics */}
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Business Intelligence</h2>
            <p className="text-gray-400 text-sm">Revenue potential and lead quality analysis</p>
          </div>
        </div>

        {/* Key Business Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                💰
              </div>
              <div className="text-sm text-green-400 font-medium">Revenue Potential</div>
            </div>
            <div className="text-2xl font-bold text-white">
              ${(businessData.revenueEstimates?.total || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total pipeline value</div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                ⭐
              </div>
              <div className="text-sm text-blue-400 font-medium">Avg Lead Quality</div>
            </div>
            <div className="text-2xl font-bold text-white">
              {businessData.leadQuality?.average || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">Out of 100 points</div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                🚀
              </div>
              <div className="text-sm text-purple-400 font-medium">Viral Coefficient</div>
            </div>
            <div className="text-2xl font-bold text-white">
              {businessData.viralCoefficient || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">Shares per user</div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                📈
              </div>
              <div className="text-sm text-amber-400 font-medium">Intent Rate</div>
            </div>
            <div className="text-2xl font-bold text-white">
              {businessData.totalLeads > 0 ? 
                ((businessData.totalIntents / businessData.totalLeads) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Lead to product interest</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Revenue Breakdown by Level */}
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Potential by AI Level</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="level" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    radius={[4, 4, 0, 0]}
                    fill="url(#revenueGradient)"
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Quality Distribution */}
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Quality Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadQualityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="quality" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {leadQualityData.map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recent Activity (24h) */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm">
                  🚀
                </div>
                <span className="text-gray-300 text-sm">New Test Starts</span>
              </div>
              <span className="text-white font-bold">
                {businessData.recentActivity?.testStarts || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-sm">
                  👤
                </div>
                <span className="text-gray-300 text-sm">New Leads</span>
              </div>
              <span className="text-white font-bold">
                {businessData.recentActivity?.newLeads || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm">
                  💎
                </div>
                <span className="text-gray-300 text-sm">New Intents</span>
              </div>
              <span className="text-white font-bold">
                {businessData.recentActivity?.newIntents || 0}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800/40">
              <div className="text-xs text-gray-500">Last 24 hours</div>
            </div>
          </div>
        </div>

        {/* Top Insights */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
              <div className="text-green-400 font-medium mb-1">High-Value Segment</div>
              <div className="text-gray-300">
                {businessData.leadQuality?.high || 0} users with 80+ quality score
              </div>
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <div className="text-blue-400 font-medium mb-1">Conversion Potential</div>
              <div className="text-gray-300">
                {((businessData.totalIntents / Math.max(businessData.totalLeads, 1)) * 100).toFixed(1)}% intent rate
              </div>
            </div>

            <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <div className="text-purple-400 font-medium mb-1">Growth Vector</div>
              <div className="text-gray-300">
                {businessData.viralCoefficient}x viral multiplier
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Recommended Actions</h3>
          <div className="space-y-3 text-sm">
            {businessData.leadQuality?.average < 60 && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <div className="text-amber-400 font-medium mb-1">Improve Lead Quality</div>
                <div className="text-gray-400">
                  Focus on attracting higher-level AI users
                </div>
              </div>
            )}

            {(businessData.totalIntents / Math.max(businessData.totalLeads, 1)) < 0.3 && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <div className="text-blue-400 font-medium mb-1">Boost Intent Conversion</div>
                <div className="text-gray-400">
                  Optimize product positioning in results
                </div>
              </div>
            )}

            {businessData.viralCoefficient < 0.5 && (
              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                <div className="text-purple-400 font-medium mb-1">Increase Viral Growth</div>
                <div className="text-gray-400">
                  Improve sharing incentives and UX
                </div>
              </div>
            )}

            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
              <div className="text-green-400 font-medium mb-1">Revenue Opportunity</div>
              <div className="text-gray-400">
                ${((businessData.revenueEstimates?.total || 0) * 0.1).toLocaleString()} potential in Q1
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{businessData.totalLeads}</div>
            <div className="text-sm text-gray-400">Total Leads</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{businessData.totalIntents}</div>
            <div className="text-sm text-gray-400">Product Intents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              ${Math.round((businessData.revenueEstimates?.total || 0) / Math.max(businessData.totalLeads, 1))}
            </div>
            <div className="text-sm text-gray-400">Avg Revenue/Lead</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {businessData.leadQuality?.high || 0}
            </div>
            <div className="text-sm text-gray-400">High-Quality Leads</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;