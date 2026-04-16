import { supabase } from '../../supabase.js';

// Analytics queries for admin dashboard
export const adminQueries = {
  
  // Get conversion funnel metrics
  async getFunnelMetrics(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    try {
      // Get all analytics events within time range
      const { data: events, error } = await supabase
        .from('ai_level_analytics')
        .select('event_type, created_at, event_data')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      // Handle case where table doesn't exist or has no data
      if (error && error.code === 'PGRST106') {
        // Table doesn't exist yet, return empty metrics
        return {
          testStarts: 0,
          completions: 0,
          productInterests: 0,
          proveInterests: 0,
          improveInterests: 0,
          shareInitiations: 0,
          conversionRate: 0,
          leadToIntentRate: 0,
          shareRate: 0
        };
      }

      if (error) throw error;

      // Get leads and intents for conversion calculation
      const { data: leads, error: leadsError } = await supabase
        .from('ai_level_leads')
        .select('id, created_at, level, relationship_status')
        .gte('created_at', startDate);

      // Handle case where table doesn't exist or has no data  
      if (leadsError && leadsError.code === 'PGRST106') {
        // Table doesn't exist yet, use empty array
      } else if (leadsError) {
        throw leadsError;
      }

      const { data: intents, error: intentsError } = await supabase
        .from('ai_level_intents')
        .select('id, lead_id, prove_interest, improve_interest, created_at')
        .gte('created_at', startDate);

      // Handle case where table doesn't exist or has no data
      if (intentsError && intentsError.code === 'PGRST106') {
        // Table doesn't exist yet, use empty array
      } else if (intentsError) {
        throw intentsError;
      }

      // Calculate funnel metrics with safe fallbacks
      const testStarts = events?.filter(e => e.event_type === 'test_started').length || 0;
      const completions = leads?.length || 0;
      const productInterests = intents?.length || 0;
      const shareInitiations = events?.filter(e => e.event_type === 'share_initiated').length || 0;

      // Calculate product interest breakdown
      const proveInterests = intents?.filter(i => i.prove_interest).length || 0;
      const improveInterests = intents?.filter(i => i.improve_interest).length || 0;

      return {
        testStarts,
        completions,
        productInterests,
        proveInterests,
        improveInterests,
        shareInitiations,
        conversionRate: testStarts > 0 ? (completions / testStarts * 100).toFixed(1) : 0,
        leadToIntentRate: completions > 0 ? (productInterests / completions * 100).toFixed(1) : 0,
        shareRate: completions > 0 ? (shareInitiations / completions * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching funnel metrics:', error);
      // Return safe defaults instead of null
      return {
        testStarts: 0,
        completions: 0,
        productInterests: 0,
        proveInterests: 0,
        improveInterests: 0,
        shareInitiations: 0,
        conversionRate: 0,
        leadToIntentRate: 0,
        shareRate: 0
      };
    }
  },

  // Get user insights (AI levels and relationship status distribution)
  async getUserInsights() {
    try {
      const { data: leads, error } = await supabase
        .from('ai_level_leads')
        .select('level, relationship_status, created_at, phone')
        .order('created_at', { ascending: false });

      // Handle case where table doesn't exist or has no data
      if (error && error.code === 'PGRST106') {
        // Table doesn't exist yet, return empty insights
        return {
          levelDistribution: {},
          relationshipDistribution: {},
          totalUsers: 0,
          geographicData: {}
        };
      }

      if (error) throw error;

      if (!leads || leads.length === 0) {
        return {
          levelDistribution: {},
          relationshipDistribution: {},
          totalUsers: 0,
          geographicData: {}
        };
      }

      // Calculate level distribution
      const levelDistribution = leads.reduce((acc, lead) => {
        const level = lead.level >= 4 ? '4+' : String(lead.level);
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      // Calculate relationship status distribution
      const relationshipDistribution = leads.reduce((acc, lead) => {
        const status = lead.relationship_status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Geographic insights based on phone numbers
      const geographicData = leads.reduce((acc, lead) => {
        if (lead.phone && lead.phone.startsWith('+91')) {
          acc['India'] = (acc['India'] || 0) + 1;
        } else {
          acc['Other'] = (acc['Other'] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        levelDistribution,
        relationshipDistribution,
        totalUsers: leads.length,
        geographicData
      };
    } catch (error) {
      console.error('Error fetching user insights:', error);
      // Return safe defaults instead of null
      return {
        levelDistribution: {},
        relationshipDistribution: {},
        totalUsers: 0,
        geographicData: {}
      };
    }
  },

  // Get UTM source analytics
  async getUTMAnalytics(timeRange = '30d') {
    const startDate = this.getStartDate(timeRange);
    
    try {
      const { data: leads, error } = await supabase
        .from('ai_level_leads')
        .select('utm_source, utm_medium, utm_campaign, referrer, source, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error && error.code === 'PGRST106') {
        return {
          sources: {},
          campaigns: {},
          mediums: {},
          referrers: {},
          totalTracked: 0
        };
      }

      if (error) throw error;

      if (!leads || leads.length === 0) {
        return {
          sources: {},
          campaigns: {},
          mediums: {},
          referrers: {},
          totalTracked: 0
        };
      }

      // Analyze UTM sources
      const sources = leads.reduce((acc, lead) => {
        const source = lead.utm_source || lead.source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Analyze campaigns
      const campaigns = leads.reduce((acc, lead) => {
        if (lead.utm_campaign) {
          acc[lead.utm_campaign] = (acc[lead.utm_campaign] || 0) + 1;
        }
        return acc;
      }, {});

      // Analyze mediums
      const mediums = leads.reduce((acc, lead) => {
        if (lead.utm_medium) {
          acc[lead.utm_medium] = (acc[lead.utm_medium] || 0) + 1;
        }
        return acc;
      }, {});

      // Analyze referrers
      const referrers = leads.reduce((acc, lead) => {
        if (lead.referrer) {
          try {
            const domain = new URL(lead.referrer).hostname;
            acc[domain] = (acc[domain] || 0) + 1;
          } catch (e) {
            acc['unknown'] = (acc['unknown'] || 0) + 1;
          }
        }
        return acc;
      }, {});

      return {
        sources,
        campaigns,
        mediums,
        referrers,
        totalTracked: leads.length
      };
    } catch (error) {
      console.error('Error fetching UTM analytics:', error);
      return {
        sources: {},
        campaigns: {},
        mediums: {},
        referrers: {},
        totalTracked: 0
      };
    }
  },

  // Get visit analytics and conversion funnel
  async getVisitAnalytics(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    try {
      // Get all visits
      const { data: visits, error: visitsError } = await supabase
        .from('ai_level_visits')
        .select('*')
        .gte('visited_at', startDate)
        .order('visited_at', { ascending: false });

      if (visitsError && visitsError.code === 'PGRST106') {
        return {
          totalVisits: 0,
          utmSources: {},
          utmCampaigns: {},
          referrers: {},
          deviceTypes: {},
          conversionRate: 0
        };
      }

      if (visitsError) throw visitsError;

      // Get leads for conversion calculation
      const { data: leads, error: leadsError } = await supabase
        .from('ai_level_leads')
        .select('id, created_at')
        .gte('created_at', startDate);

      const leadCount = leads?.length || 0;
      const visitCount = visits?.length || 0;

      if (!visits || visits.length === 0) {
        return {
          totalVisits: 0,
          utmSources: {},
          utmCampaigns: {},
          referrers: {},
          deviceTypes: {},
          conversionRate: 0
        };
      }

      // Analyze UTM sources
      const utmSources = visits.reduce((acc, visit) => {
        const source = visit.utm_source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Analyze campaigns
      const utmCampaigns = visits.reduce((acc, visit) => {
        if (visit.utm_campaign) {
          acc[visit.utm_campaign] = (acc[visit.utm_campaign] || 0) + 1;
        }
        return acc;
      }, {});

      // Analyze referrers
      const referrers = visits.reduce((acc, visit) => {
        if (visit.referrer) {
          try {
            const domain = new URL(visit.referrer).hostname;
            acc[domain] = (acc[domain] || 0) + 1;
          } catch (e) {
            acc['unknown'] = (acc['unknown'] || 0) + 1;
          }
        }
        return acc;
      }, {});

      // Analyze device types
      const deviceTypes = visits.reduce((acc, visit) => {
        const device = visit.device_type || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {});

      return {
        totalVisits: visitCount,
        utmSources,
        utmCampaigns, 
        referrers,
        deviceTypes,
        conversionRate: visitCount > 0 ? (leadCount / visitCount * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error fetching visit analytics:', error);
      return {
        totalVisits: 0,
        utmSources: {},
        utmCampaigns: {},
        referrers: {},
        deviceTypes: {},
        conversionRate: 0
      };
    }
  },

  // Get detailed conversion funnel by UTM source
  async getUTMConversionFunnel(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    try {
      // Get visits grouped by UTM source
      const { data: visits, error: visitsError } = await supabase
        .from('ai_level_visits')
        .select('utm_source, session_id')
        .gte('visited_at', startDate);

      // Get leads with UTM data
      const { data: leads, error: leadsError } = await supabase
        .from('ai_level_leads')
        .select('utm_source, created_at')
        .gte('created_at', startDate);

      if (visitsError || leadsError) {
        return {};
      }

      // Calculate conversion rates by UTM source
      const conversionFunnel = {};

      // Group visits by UTM source
      const visitsBySource = (visits || []).reduce((acc, visit) => {
        const source = visit.utm_source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Group leads by UTM source  
      const leadsBySource = (leads || []).reduce((acc, lead) => {
        const source = lead.utm_source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Calculate conversion rates
      for (const [source, visitCount] of Object.entries(visitsBySource)) {
        const leadCount = leadsBySource[source] || 0;
        conversionFunnel[source] = {
          visits: visitCount,
          leads: leadCount,
          conversionRate: visitCount > 0 ? (leadCount / visitCount * 100).toFixed(2) : 0
        };
      }

      return conversionFunnel;
    } catch (error) {
      console.error('Error fetching UTM conversion funnel:', error);
      return {};
    }
  },

  // Get business intelligence metrics
  async getBusinessIntelligence() {
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('ai_level_leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Handle case where table doesn't exist
      if (leadsError && leadsError.code === 'PGRST106') {
        // Return safe defaults when table doesn't exist
        return {
          leadQuality: { average: 0, high: 0, medium: 0, low: 0 },
          revenueEstimates: { total: 0, breakdown: {} },
          viralCoefficient: 0,
          recentActivity: { newLeads: 0, newIntents: 0, testStarts: 0 },
          totalLeads: 0,
          totalIntents: 0
        };
      }

      if (leadsError) throw leadsError;

      const { data: intents, error: intentsError } = await supabase
        .from('ai_level_intents')
        .select('*');

      // Handle case where table doesn't exist
      if (intentsError && intentsError.code === 'PGRST106') {
        // Continue with empty intents array
      } else if (intentsError) {
        throw intentsError;
      }

      const { data: analytics, error: analyticsError } = await supabase
        .from('ai_level_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      // Handle case where table doesn't exist
      if (analyticsError && analyticsError.code === 'PGRST106') {
        // Continue with empty analytics array
      } else if (analyticsError) {
        throw analyticsError;
      }

      // Lead quality scoring
      const leadQuality = this.calculateLeadQuality(leads || [], intents || []);

      // Revenue potential (rough estimates based on level and intent)
      const revenueEstimates = this.calculateRevenueEstimates(leads || [], intents || []);

      // Viral coefficient calculation
      const viralCoefficient = this.calculateViralCoefficient(analytics || []);

      // Recent activity (last 24 hours)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentActivity = {
        newLeads: leads?.filter(l => l.created_at > last24Hours).length || 0,
        newIntents: intents?.filter(i => i.created_at > last24Hours).length || 0,
        testStarts: analytics?.filter(a => a.event_type === 'test_started' && a.created_at > last24Hours).length || 0
      };

      return {
        leadQuality,
        revenueEstimates,
        viralCoefficient,
        recentActivity,
        totalLeads: leads?.length || 0,
        totalIntents: intents?.length || 0
      };
    } catch (error) {
      console.error('Error fetching business intelligence:', error);
      // Return safe defaults instead of null
      return {
        leadQuality: { average: 0, high: 0, medium: 0, low: 0 },
        revenueEstimates: { total: 0, breakdown: {} },
        viralCoefficient: 0,
        recentActivity: { newLeads: 0, newIntents: 0, testStarts: 0 },
        totalLeads: 0,
        totalIntents: 0
      };
    }
  },

  // Get time-based analytics for charts
  async getTimeSeriesData(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    try {
      const { data: analytics, error } = await supabase
        .from('ai_level_analytics')
        .select('event_type, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { data: leads, error: leadsError } = await supabase
        .from('ai_level_leads')
        .select('created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (leadsError) throw leadsError;

      // Group data by day
      const dailyData = this.groupByDay([...(analytics || []), ...(leads || []).map(l => ({ event_type: 'lead_captured', created_at: l.created_at }))]);
      
      return dailyData;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      return [];
    }
  },

  // Get real-time stats for live dashboard
  async getRealTimeStats() {
    try {
      const now = new Date();
      const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      const { data: recentEvents, error } = await supabase
        .from('ai_level_analytics')
        .select('event_type, created_at')
        .gte('created_at', last5Minutes)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        activeUsers: recentEvents?.filter(e => e.event_type === 'test_started').length || 0,
        recentEvents: recentEvents?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      return null;
    }
  },

  // Helper functions
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  },

  calculateLeadQuality(leads, intents) {
    if (!leads || leads.length === 0) return {};

    const qualityScores = leads.map(lead => {
      let score = 0;
      
      // Higher AI levels get higher scores
      score += (lead.level || 0) * 20;
      
      // Relationship status scoring
      const relationshipScores = {
        'merged': 25,
        'committed': 20,
        'complicated': 15,
        'casual': 10,
        'single': 5
      };
      score += relationshipScores[lead.relationship_status] || 0;
      
      // Bonus for product interest
      const hasIntent = intents?.some(i => i.lead_id === lead.id);
      if (hasIntent) score += 30;
      
      return Math.min(score, 100); // Cap at 100
    });

    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    return {
      average: Math.round(avgQuality),
      high: qualityScores.filter(s => s >= 80).length,
      medium: qualityScores.filter(s => s >= 50 && s < 80).length,
      low: qualityScores.filter(s => s < 50).length
    };
  },

  calculateRevenueEstimates(leads, intents) {
    if (!leads || leads.length === 0) return { total: 0, breakdown: {} };

    // Rough revenue estimates per user segment
    const revenuePerLevel = {
      0: 10,  // $10 potential
      1: 25,  // $25 potential
      2: 50,  // $50 potential
      3: 100, // $100 potential
      4: 200  // $200 potential
    };

    let totalRevenue = 0;
    const breakdown = {};

    leads.forEach(lead => {
      const level = Math.min(lead.level || 0, 4);
      const baseRevenue = revenuePerLevel[level];
      
      // Multiply by intent factor
      const hasIntent = intents?.some(i => i.lead_id === lead.id);
      const revenue = hasIntent ? baseRevenue * 2 : baseRevenue;
      
      totalRevenue += revenue;
      const levelKey = level >= 4 ? '4+' : String(level);
      breakdown[levelKey] = (breakdown[levelKey] || 0) + revenue;
    });

    return {
      total: totalRevenue,
      breakdown
    };
  },

  calculateViralCoefficient(analytics) {
    if (!analytics || analytics.length === 0) return 0;

    const shares = analytics.filter(a => a.event_type === 'share_completed').length;
    const testStarts = analytics.filter(a => a.event_type === 'test_started').length;
    
    // Simplified viral coefficient calculation
    return testStarts > 0 ? (shares / testStarts).toFixed(2) : 0;
  },

  groupByDay(events) {
    const grouped = {};
    
    events.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, test_started: 0, lead_captured: 0, share_initiated: 0 };
      }
      
      if (event.event_type === 'test_started') grouped[date].test_started++;
      if (event.event_type === 'lead_captured') grouped[date].lead_captured++;
      if (event.event_type === 'share_initiated') grouped[date].share_initiated++;
    });
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }
};