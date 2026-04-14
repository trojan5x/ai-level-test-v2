import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth.js';
import { activityLogger, performSecurityChecks } from '../utils/adminHelpers.js';
import MetricsGrid from './MetricsGrid.jsx';
import ConversionFunnel from './ConversionFunnel.jsx';
import UserInsights from './UserInsights.jsx';
import BusinessIntelligence from './BusinessIntelligence.jsx';
import UTMAnalytics from './UTMAnalytics.jsx';

const AdminDashboard = () => {
  const { logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [securityChecks, setSecurityChecks] = useState([]);

  useEffect(() => {
    // Log dashboard access
    activityLogger.log('dashboard_accessed');
    
    // Perform security checks
    const checks = performSecurityChecks();
    setSecurityChecks(checks);

    // Log security check results
    if (checks.length > 0) {
      activityLogger.log('security_checks_performed', { 
        checks: checks.length,
        errors: checks.filter(c => c.level === 'error').length 
      });
    }
  }, []);

  const handleTabChange = (tabId) => {
    activityLogger.log('tab_changed', { from: activeTab, to: tabId });
    setActiveTab(tabId);
  };

  const handleTimeRangeChange = (range) => {
    activityLogger.log('time_range_changed', { from: timeRange, to: range });
    setTimeRange(range);
  };

  const handleLogout = () => {
    activityLogger.log('logout_initiated');
    logout();
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'funnel', name: 'Conversion Funnel', icon: '🔄' },
    { id: 'utm', name: 'Traffic & UTM', icon: '📈' },
    { id: 'insights', name: 'User Insights', icon: '👥' },
    { id: 'intelligence', name: 'Business Intelligence', icon: '💡' }
  ];

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/50 border-b border-gray-800/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/learntube-icon.svg" 
                  alt="LearnTube" 
                  className="w-8 h-8"
                />
                <div>
                  <h1 className="text-lg font-bold">Admin Dashboard</h1>
                  <p className="text-xs text-gray-400">AI Level Test Analytics</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-900/30 border-b border-gray-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  {tab.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Alerts */}
        {securityChecks.length > 0 && (
          <div className="mb-6 space-y-2">
            {securityChecks.map((check, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-sm ${
                  check.level === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{check.level === 'error' ? '🚨' : '⚠️'}</span>
                  {check.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Status Indicator */}
        <div className="mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live data • Updates every 30 seconds</span>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <MetricsGrid timeRange={timeRange} />
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                <ConversionFunnel timeRange={timeRange} compact />
              </div>
            </div>
          )}
          
          {activeTab === 'funnel' && (
            <ConversionFunnel timeRange={timeRange} />
          )}
          
          {activeTab === 'utm' && (
            <UTMAnalytics timeRange={timeRange} />
          )}
          
          {activeTab === 'insights' && (
            <UserInsights timeRange={timeRange} />
          )}
          
          {activeTab === 'intelligence' && (
            <BusinessIntelligence timeRange={timeRange} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-800/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              AI Level Test Admin Dashboard • LearnTube
            </p>
            <p className="text-xs text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;