import { createClient } from '@supabase/supabase-js';
import { utmTracker } from './utils/utmTracker.js';

// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://qzmjxjgmdhwftchyynja.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bWp4amdtZGh3ZnRjaHl5bmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTc3MzksImV4cCI6MjA5MTczMzczOX0.FfOq-EZqQ8_3pm_bym-HfiF0iTnJy29BZ4epeBTiPpk'
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Generate session ID for analytics
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('ai-level-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('ai-level-session-id', sessionId);
  }
  return sessionId;
};

// LLM scoring with fallback to keyword scoring
export const scoreLLMResponse = async (item, text) => {
  try {
    // Set 3-second timeout as per handoff document
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const { data, error } = await supabase.functions.invoke('llm-score-response', {
      body: { item, text },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (error) {
      console.log('🔄 LLM scoring failed, using keyword fallback:', error.message);
      return { useFallback: true };
    }

    console.log(`🤖 LLM scored item ${item}: ${data.score} (${data.model})`);
    return { 
      score: data.score, 
      reasoning: data.reasoning,
      model: data.model 
    };

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⏱️ LLM scoring timeout (3s), using keyword fallback');
    } else {
      console.error('❌ LLM scoring exception:', err);
    }
    return { useFallback: true };
  }
};

// Lead capture with Supabase integration and UTM tracking
export const captureLeadData = async (leadData) => {
  console.log('💾 Capturing lead data:', leadData);
  
  // Keep window global for backward compatibility during transition
  window.__aiLevelLead = leadData;
  
  try {
    // Get UTM attribution data
    const attribution = utmTracker.formatForDatabase();
    console.log('🎯 Attribution data:', attribution);

    const { data, error } = await supabase
      .from('ai_level_leads')
      .insert([{
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email || null,
        level: leadData.level,
        relationship_status: leadData.relationshipStatus,
        scores: leadData.scores,
        source: attribution.source || 'web',
        created_at: new Date().toISOString(),
        // UTM attribution fields
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
        referrer: attribution.referrer,
        landing_page: attribution.landing_page
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase lead capture error:', error);
      // Fallback to window global on error
      return { success: false, error };
    }
    
    console.log('✅ Lead captured successfully:', data);
    console.log('🎯 UTM Summary:', utmTracker.getSummary());
    
    // Store lead ID for intent tracking
    sessionStorage.setItem('ai-level-lead-id', data.id);
    
    return { success: true, data, attribution };
    
  } catch (err) {
    console.error('❌ Lead capture exception:', err);
    return { success: false, error: err };
  }
};

// Intent capture with Supabase integration (check for existing record first)
export const captureIntentData = async (intentData) => {
  console.log('💾 Capturing intent data:', intentData);
  
  // Keep window global for backward compatibility
  window.__aiLevelIntent = intentData;
  
  try {
    // Get lead_id from the most recent lead capture
    const leadData = window.__aiLevelLead;
    const lead_id = leadData?.id || null; // Will be null if Supabase capture failed
    
    if (!lead_id) {
      console.warn('⚠️ No lead_id found, skipping intent capture');
      return { success: false, error: 'No lead_id found' };
    }
    
    // Check if record already exists for this lead_id
    const { data: existingRecord, error: selectError } = await supabase
      .from('ai_level_intents')
      .select('*')
      .eq('lead_id', lead_id)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing record:', selectError);
      return { success: false, error: selectError };
    }
    
    const intentRecord = {
      lead_id,
      prove_interest: intentData.prove || (existingRecord?.prove_interest || false),
      improve_interest: intentData.improve || (existingRecord?.improve_interest || false),
      level: intentData.level,
      relationship_status: intentData.relationshipStatus,
      created_at: existingRecord?.created_at || new Date().toISOString()
    };
    
    let data, error;
    
    if (existingRecord) {
      // Update existing record
      ({ data, error } = await supabase
        .from('ai_level_intents')
        .update(intentRecord)
        .eq('lead_id', lead_id)
        .select()
        .single());
      console.log('📝 Updating existing intent record');
    } else {
      // Insert new record
      ({ data, error } = await supabase
        .from('ai_level_intents')
        .insert([intentRecord])
        .select()
        .single());
      console.log('📝 Creating new intent record');
    }
    
    if (error) {
      console.error('❌ Supabase intent capture error:', error);
      return { success: false, error };
    }
    
    console.log('✅ Intent captured successfully:', data);
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ Intent capture exception:', err);
    return { success: false, error: err };
  }
};

// Analytics event tracking
export const trackAnalyticsEvent = async (eventType, eventData = {}) => {
  const sessionId = getSessionId();
  
  try {
    const { data, error } = await supabase
      .from('ai_level_analytics')
      .insert([{
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error(`❌ Analytics error for ${eventType}:`, error);
      return { success: false, error };
    }
    
    console.log(`📊 Analytics tracked: ${eventType}`);
    return { success: true, data };
    
  } catch (err) {
    console.error(`❌ Analytics exception for ${eventType}:`, err);
    return { success: false, error: err };
  }
};

// Admin table setup (run once during deployment)
export const setupAdminTables = async () => {
  try {
    // Create admin_config table
    const { error: configError } = await supabase.rpc('create_admin_config_table');
    if (configError && !configError.message.includes('already exists')) {
      console.error('Error creating admin_config table:', configError);
    }

    // Create admin_sessions table  
    const { error: sessionsError } = await supabase.rpc('create_admin_sessions_table');
    if (sessionsError && !sessionsError.message.includes('already exists')) {
      console.error('Error creating admin_sessions table:', sessionsError);
    }

    console.log('✅ Admin tables setup completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Admin tables setup failed:', error);
    return { success: false, error };
  }
};

export { supabase };