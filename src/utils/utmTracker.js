// UTM Parameter and Attribution Tracking Utility
import { supabase } from '../supabase.js';

const UTM_STORAGE_KEY = 'ai-level-utm-data';
const UTM_EXPIRY_DAYS = 30; // UTM attribution window

// UTM parameter names to track
const UTM_PARAMS = [
  'utm_source',
  'utm_medium', 
  'utm_campaign',
  'utm_term',
  'utm_content'
];

// Additional tracking parameters
const TRACKING_PARAMS = [
  'ref', // Custom referrer parameter
  'gclid', // Google Ads click ID
  'fbclid', // Facebook click ID
  'msclkid' // Microsoft Ads click ID
];

export const utmTracker = {
  
  // Get or create session ID for visit tracking
  getSessionId() {
    let sessionId = sessionStorage.getItem('ai-level-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('ai-level-session-id', sessionId);
    }
    return sessionId;
  },

  // Detect device type
  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/.test(userAgent)) return 'tablet';
    if (/mobile|iphone|android/.test(userAgent)) return 'mobile';
    return 'desktop';
  },

  // Log visit to database immediately (with robust deduplication)
  async logVisit(utmData) {
    try {
      const sessionId = this.getSessionId();
      console.log('🎯 Attempting to log visit for session:', sessionId);
      
      // Check if we've already logged a visit for this session
      const visitLoggedKey = `ai-level-visit-logged-${sessionId}`;
      const alreadyLogged = sessionStorage.getItem(visitLoggedKey);
      
      if (alreadyLogged) {
        console.log('🎯 Visit already logged for session:', sessionId, '- skipping duplicate');
        return null;
      }

      // Double-check database to see if this session already has a visit
      const { data: existingVisit, error: checkError } = await supabase
        .from('ai_level_visits')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (checkError) {
        console.warn('Error checking existing visit:', checkError);
      }

      if (existingVisit) {
        console.log('🎯 Visit already exists in database for session:', sessionId, '- marking as logged');
        sessionStorage.setItem(visitLoggedKey, 'true');
        return existingVisit;
      }

      console.log('🎯 Creating new visit record for session:', sessionId);

      const visitRecord = {
        session_id: sessionId,
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_term: utmData.utm_term,
        utm_content: utmData.utm_content,
        referrer: utmData.referrer,
        landing_page: utmData.landing_page,
        gclid: utmData.gclid,
        fbclid: utmData.fbclid,
        msclkid: utmData.msclkid,
        ref: utmData.ref,
        user_agent: navigator.userAgent,
        device_type: this.getDeviceType(),
        visited_at: new Date().toISOString()
      };

      // Use insert with error handling for duplicates
      const { data, error } = await supabase
        .from('ai_level_visits')
        .insert([visitRecord])
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate key error (unique constraint violation)
        if (error.code === '23505') {
          console.log('🎯 Duplicate prevented by database constraint for session:', sessionId);
          sessionStorage.setItem(visitLoggedKey, 'true');
          return null;
        }
        console.warn('Failed to log visit:', error);
        return null;
      }

      // Mark this session as having logged a visit
      sessionStorage.setItem(visitLoggedKey, 'true');
      
      console.log('🎯 Visit logged successfully:', data.id, 'for session:', sessionId);
      return data;
    } catch (error) {
      console.error('Error logging visit:', error);
      return null;
    }
  },

  // Capture and store UTM parameters from URL on page load
  async captureFromURL() {
    try {
      const sessionId = this.getSessionId();
      console.log('🎯 captureFromURL called for session:', sessionId);

      // Check if we've already captured for this session
      const captureKey = `ai-level-utm-captured-${sessionId}`;
      if (sessionStorage.getItem(captureKey)) {
        console.log('🎯 UTM already captured for session:', sessionId);
        return null;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        // UTM Parameters
        utm_source: urlParams.get('utm_source') || null,
        utm_medium: urlParams.get('utm_medium') || null,
        utm_campaign: urlParams.get('utm_campaign') || null,
        utm_term: urlParams.get('utm_term') || null,
        utm_content: urlParams.get('utm_content') || null,
        
        // Additional tracking
        ref: urlParams.get('ref') || null,
        gclid: urlParams.get('gclid') || null,
        fbclid: urlParams.get('fbclid') || null,
        msclkid: urlParams.get('msclkid') || null,
        
        // Attribution data
        referrer: document.referrer || null,
        landing_page: window.location.href,
        
        // Timestamp for expiry
        captured_at: Date.now(),
        expires_at: Date.now() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      };

      // Always log the visit to track landing page analytics
      await this.logVisit(utmData);

      // Mark as captured for this session
      sessionStorage.setItem(captureKey, 'true');

      // Only store in session/localStorage if we have tracking data
      const hasTrackingData = UTM_PARAMS.some(param => utmData[param]) || 
                             TRACKING_PARAMS.some(param => utmData[param]) ||
                             utmData.referrer;

      if (hasTrackingData) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));
        
        // Also store in localStorage for cross-session attribution
        const existingData = this.getStoredData('localStorage');
        if (!existingData || this.hasNewUtmData(utmData, existingData)) {
          localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));
        }
        
        console.log('🎯 UTM tracking captured for session:', sessionId, utmData);
        return utmData;
      }

      console.log('🎯 No tracking data found, visit logged only for session:', sessionId);
      return utmData; // Return even if no UTM data for visit tracking
    } catch (error) {
      console.error('Error capturing UTM data:', error);
      return null;
    }
  },

  // Check if new UTM data is different from existing
  hasNewUtmData(newData, existingData) {
    return UTM_PARAMS.some(param => 
      newData[param] && newData[param] !== existingData[param]
    );
  },

  // Get stored UTM data (session first, then localStorage fallback)
  getStoredData(storageType = 'session') {
    try {
      const storage = storageType === 'session' ? sessionStorage : localStorage;
      const stored = storage.getItem(UTM_STORAGE_KEY);
      
      if (!stored) return null;

      const utmData = JSON.parse(stored);
      
      // Check if data has expired
      if (utmData.expires_at && Date.now() > utmData.expires_at) {
        storage.removeItem(UTM_STORAGE_KEY);
        return null;
      }

      return utmData;
    } catch (error) {
      console.error('Error retrieving UTM data:', error);
      return null;
    }
  },

  // Get attribution data for lead capture
  getAttributionData() {
    // Try session storage first (current session)
    let utmData = this.getStoredData('session');
    
    // Fall back to localStorage (cross-session attribution)
    if (!utmData) {
      utmData = this.getStoredData('localStorage');
    }

    if (!utmData) {
      // No stored UTM data, capture basic attribution
      return {
        referrer: document.referrer || null,
        landing_page: window.location.origin,
        utm_source: this.inferSource(),
        captured_at: Date.now()
      };
    }

    return utmData;
  },

  // Infer traffic source from referrer if no UTM data
  inferSource() {
    const referrer = document.referrer;
    if (!referrer) return 'direct';

    try {
      const referrerDomain = new URL(referrer).hostname.toLowerCase();
      
      // Common source mapping
      const sourceMap = {
        'google.': 'google',
        'bing.': 'bing',
        'yahoo.': 'yahoo',
        'duckduckgo.': 'duckduckgo',
        'facebook.': 'facebook',
        'twitter.': 'twitter',
        'linkedin.': 'linkedin',
        'instagram.': 'instagram',
        'youtube.': 'youtube',
        'tiktok.': 'tiktok',
        'whatsapp.': 'whatsapp',
        'telegram.': 'telegram'
      };

      for (const [domain, source] of Object.entries(sourceMap)) {
        if (referrerDomain.includes(domain)) {
          return source;
        }
      }

      return 'referral';
    } catch (error) {
      return 'unknown';
    }
  },

  // Clear stored UTM data
  clearStoredData() {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
    localStorage.removeItem(UTM_STORAGE_KEY);
  },

  // Initialize UTM tracking on app start (with deduplication)
  initialize() {
    const sessionId = this.getSessionId();
    console.log('🎯 UTM tracker initialize called for session:', sessionId);
    
    // Prevent multiple initializations in the same session
    const initKey = `ai-level-utm-initialized-${sessionId}`;
    if (sessionStorage.getItem(initKey)) {
      console.log('🎯 UTM tracking already initialized for session:', sessionId);
      return;
    }

    console.log('🎯 Initializing UTM tracking for session:', sessionId);
    
    // Capture UTM parameters from current URL
    this.captureFromURL();

    // Clean up expired data from localStorage
    this.cleanupExpiredData();
    
    // Mark as initialized for this session
    sessionStorage.setItem(initKey, 'true');
  },

  // Clean up expired UTM data
  cleanupExpiredData() {
    try {
      const stored = localStorage.getItem(UTM_STORAGE_KEY);
      if (stored) {
        const utmData = JSON.parse(stored);
        if (utmData.expires_at && Date.now() > utmData.expires_at) {
          localStorage.removeItem(UTM_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error cleaning up UTM data:', error);
    }
  },

  // Format UTM data for database storage
  formatForDatabase() {
    const attribution = this.getAttributionData();
    if (!attribution) return {};

    return {
      utm_source: attribution.utm_source || null,
      utm_medium: attribution.utm_medium || null,
      utm_campaign: attribution.utm_campaign || null,
      utm_term: attribution.utm_term || null,
      utm_content: attribution.utm_content || null,
      referrer: attribution.referrer || null,
      landing_page: attribution.landing_page || null,
      source: attribution.utm_source || this.inferSource() // Legacy source field
    };
  },

  // Get UTM summary for analytics
  getSummary() {
    const attribution = this.getAttributionData();
    if (!attribution) return 'No attribution data';

    const parts = [];
    if (attribution.utm_source) parts.push(`Source: ${attribution.utm_source}`);
    if (attribution.utm_medium) parts.push(`Medium: ${attribution.utm_medium}`);
    if (attribution.utm_campaign) parts.push(`Campaign: ${attribution.utm_campaign}`);
    
    return parts.length > 0 ? parts.join(' | ') : 'Direct traffic';
  }
};