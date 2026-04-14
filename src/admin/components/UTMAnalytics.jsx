import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminQueries } from '../services/adminQueries.js';

const UTMAnalytics = ({ timeRange, compact = false }) => {
  const [visitData, setVisitData] = useState(null);
  const [conversionFunnel, setConversionFunnel] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUTMData();
  }, [timeRange]);

  const loadUTMData = async () => {
    setIsLoading(true);
    try {
      const [visits, funnel] = await Promise.all([
        adminQueries.getVisitAnalytics(timeRange),
        adminQueries.getUTMConversionFunnel(timeRange)
      ]);

      setVisitData(visits);
      setConversionFunnel(funnel);
    } catch (error) {
      console.error('Error loading UTM data:', error);
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
            <div className="h-64 bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!visitData || visitData.totalVisits === 0) {
    return (
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40">
        <h2 className="text-xl font-bold text-white mb-4">UTM & Traffic Analytics</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-gray-400">No visitor data available yet</p>
          <p className="text-gray-500 text-sm mt-2">Visits are tracked automatically when users land on the page</p>
        </div>
      </div>
    );
  }

  // Prepare UTM sources data for pie chart
  const sourceColors = {
    'direct': '#6B7280',
    'google': '#4285F4',
    'facebook': '#1877F2', 
    'instagram': '#E4405F',
    'linkedin': '#0A66C2',
    'twitter': '#1DA1F2',
    'youtube': '#FF0000',
    'email': '#34D399',
    'referral': '#F59E0B'
  };

  const sourceData = Object.entries(visitData.utmSources).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count,
    percentage: (count / visitData.totalVisits * 100).toFixed(1),
    fill: sourceColors[source] || '#8B5CF6'
  }));

  // Prepare conversion funnel data
  const funnelData = Object.entries(conversionFunnel).map(([source, data]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    visits: data.visits,
    leads: data.leads,
    conversionRate: parseFloat(data.conversionRate)
  })).sort((a, b) => b.visits - a.visits);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.name || label}</p>
          <p className="text-gray-300">{`Visits: ${data.value || data.visits}`}</p>
          {data.leads !== undefined && (
            <>
              <p className="text-gray-300">{`Leads: ${data.leads}`}</p>
              <p className="text-gray-400 text-sm">{`Conversion: ${data.conversionRate}%`}</p>
            </>
          )}
          {data.percentage && (
            <p className="text-gray-400 text-sm">{`${data.percentage}% of traffic`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage < 5) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">UTM & Traffic Analytics</h2>
            <p className="text-gray-400 text-sm">Landing page visits and traffic source analysis</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{visitData.totalVisits.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Visits</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{visitData.totalVisits}</div>
            <div className="text-xs text-gray-400">Visits</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-green-400">{visitData.conversionRate}%</div>
            <div className="text-xs text-gray-400">Conversion</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-purple-400">{Object.keys(visitData.utmSources).length}</div>
            <div className="text-xs text-gray-400">Sources</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{Object.keys(visitData.utmCampaigns).length}</div>
            <div className="text-xs text-gray-400">Campaigns</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Traffic Sources Pie Chart */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {sourceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <div className="text-gray-400">
                  {item.value} ({item.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion by Source */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Conversion by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis type="category" dataKey="source" stroke="#9CA3AF" fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="visits" fill="#3B82F6" name="Visits" />
                <Bar dataKey="leads" fill="#10B981" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      {Object.keys(visitData.utmCampaigns).length > 0 && (
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Top Campaigns</h3>
          <div className="space-y-3">
            {Object.entries(visitData.utmCampaigns)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([campaign, count]) => (
              <div key={campaign} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                <div>
                  <div className="text-white font-medium">{campaign}</div>
                  <div className="text-xs text-gray-400">Campaign</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{count}</div>
                  <div className="text-xs text-gray-400">visits</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Device Types</h3>
          <div className="space-y-3">
            {Object.entries(visitData.deviceTypes).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{device}</span>
                <div className="text-right">
                  <div className="text-white font-medium">{count}</div>
                  <div className="text-xs text-gray-400">
                    {(count / visitData.totalVisits * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {Object.entries(visitData.referrers)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([domain, count]) => (
              <div key={domain} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm truncate">{domain}</span>
                <div className="text-white font-medium">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Conversion Rate</span>
              <span className="text-white font-medium">{visitData.conversionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Best Converting Source</span>
              <span className="text-white font-medium">
                {funnelData.length > 0 ? 
                  funnelData.reduce((best, current) => 
                    current.conversionRate > best.conversionRate ? current : best
                  ).source : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Unique Visitors</span>
              <span className="text-white font-medium">{visitData.totalVisits}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMAnalytics;