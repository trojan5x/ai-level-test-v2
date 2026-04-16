import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminQueries } from '../services/adminQueries.js';

const UserInsights = ({ timeRange, compact = false }) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [timeRange]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const data = await adminQueries.getUserInsights();
      setInsights(data);
    } catch (error) {
      console.error('Error loading user insights:', error);
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

  if (!insights || insights.totalUsers === 0) {
    return (
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40">
        <h2 className="text-xl font-bold text-white mb-4">User Insights</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400">No user data available yet</p>
          <p className="text-gray-500 text-sm mt-2">Start promoting the test to see insights here</p>
        </div>
      </div>
    );
  }

  // Prepare AI Level distribution data
  const levelColors = {
    '0': '#EF4444',    // Red - Non-User
    '1': '#F97316',    // Orange - Experimenter  
    '2': '#EAB308',    // Yellow - Functional User
    '3': '#22C55E',    // Green - Effective Practitioner
    '4+': '#8B5CF6'    // Purple - AI-Native Performer
  };

  const levelData = Object.entries(insights.levelDistribution).map(([level, count]) => ({
    level: `Level ${level}`,
    count,
    percentage: (count / insights.totalUsers * 100).toFixed(1),
    fill: levelColors[level] || '#6B7280'
  }));

  // Prepare relationship status data
  const relationshipColors = {
    'single': '#EF4444',
    'casual': '#F97316',
    'committed': '#EAB308',
    'merged': '#22C55E',
    'complicated': '#8B5CF6'
  };

  const relationshipData = Object.entries(insights.relationshipDistribution).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: (count / insights.totalUsers * 100).toFixed(1),
    fill: relationshipColors[status] || '#6B7280'
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.level || data.status}</p>
          <p className="text-gray-300">{`Count: ${data.count}`}</p>
          <p className="text-gray-400 text-sm">{`${data.percentage}% of users`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage < 5) return null; // Don't show labels for small slices
    
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
            <h2 className="text-xl font-bold text-white">User Insights</h2>
            <p className="text-gray-400 text-sm">AI proficiency and relationship analysis</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{insights.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AI Level Distribution */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">AI Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {levelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {levelData.map((item) => (
              <div key={item.level} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="text-gray-300">{item.level}</span>
                </div>
                <div className="text-gray-400">
                  {item.count} ({item.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Status Distribution */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">AI Relationship Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relationshipData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis type="category" dataKey="status" stroke="#9CA3AF" fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {relationshipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geographic and Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Geographic Distribution */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
          <div className="space-y-3">
            {Object.entries(insights.geographicData).map(([region, count]) => (
              <div key={region} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">{region}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{count}</div>
                  <div className="text-xs text-gray-400">
                    {(count / insights.totalUsers * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Levels */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Level Performance</h3>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {insights.levelDistribution['4+'] || insights.levelDistribution['4'] || 0}
              </div>
              <div className="text-sm text-gray-400">AI-Native Users</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-green-400">
                {insights.levelDistribution['3'] || 0}
              </div>
              <div className="text-sm text-gray-400">Effective Practitioners</div>
            </div>
            <div className="text-sm text-gray-500 text-center mt-4">
              {(((insights.levelDistribution['3'] || 0) + (insights.levelDistribution['4+'] || 0) + (insights.levelDistribution['4'] || 0)) / insights.totalUsers * 100).toFixed(1)}% advanced users
            </div>
          </div>
        </div>

        {/* Engagement Quality */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Engagement Quality</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg AI Level</span>
              <span className="text-white font-medium">
                {Object.entries(insights.levelDistribution)
                  .reduce((sum, [level, count]) => sum + (parseInt(level) || 4) * count, 0) / 
                 Object.values(insights.levelDistribution)
                  .reduce((sum, count) => sum + count, 0) || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Most Common</span>
              <span className="text-white font-medium">
                {Object.entries(insights.levelDistribution)
                  .reduce((max, [level, count]) => count > max[1] ? [level, count] : max, ['0', 0])[0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Relationship</span>
              <span className="text-white font-medium capitalize">
                {Object.entries(insights.relationshipDistribution)
                  .reduce((max, [status, count]) => count > max[1] ? [status, count] : max, ['single', 0])[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInsights;