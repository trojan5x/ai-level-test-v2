import { useState, useEffect } from 'react';
import { adminQueries } from '../services/adminQueries.js';

export const useAdminData = (timeRange = '7d') => {
  const [data, setData] = useState({
    metrics: null,
    funnel: null,
    insights: null,
    business: null,
    realTime: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load all admin data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [funnelData, userInsights, businessData, realTimeStats] = await Promise.all([
        adminQueries.getFunnelMetrics(timeRange),
        adminQueries.getUserInsights(),
        adminQueries.getBusinessIntelligence(),
        adminQueries.getRealTimeStats()
      ]);

      setData({
        funnel: funnelData,
        insights: userInsights,
        business: businessData,
        realTime: realTimeStats
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  // Manual refresh function
  const refresh = () => {
    loadData();
  };

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};