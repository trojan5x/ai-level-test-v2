import { createClient } from '@supabase/supabase-js';
import { utmTracker } from './utils/utmTracker.js';
import { shouldTrackAnalytics } from './utils/analyticsEnvironment.js';

// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://qzmjxjgmdhwftchyynja.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bWp4amdtZGh3ZnRjaHl5bmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTc3MzksImV4cCI6MjA5MTczMzczOX0.FfOq-EZqQ8_3pm_bym-HfiF0iTnJy29BZ4epeBTiPpk'
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Generate session ID for analytics
const SESSION_ID_KEY = 'ai-level-session-id';
const ASSESSMENT_STATE_KEY = 'ai-level-assessment-state';
const ASSESSMENT_DB_ID_KEY = 'ai-level-assessment-db-id';

const getSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

/** Match the session_id used when the assessment was saved to the database */
const resolveAssessmentSessionId = () => {
  try {
    const raw =
      localStorage.getItem(ASSESSMENT_STATE_KEY) ||
      sessionStorage.getItem(ASSESSMENT_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const fromState = parsed?.analytics?.sessionId;
      if (fromState) {
        sessionStorage.setItem(SESSION_ID_KEY, fromState);
        return fromState;
      }
    }
  } catch (_) {}

  const fromStorage = sessionStorage.getItem(SESSION_ID_KEY);
  if (fromStorage) return fromStorage;

  return getSessionId();
};

/** Store assessment row UUID for reliable intent updates */
export const persistAssessmentDbId = (assessmentId) => {
  if (assessmentId) {
    sessionStorage.setItem(ASSESSMENT_DB_ID_KEY, assessmentId);
  }
};

const INTENT_SELECT_COLUMNS =
  'id, prove_interest, improve_interest, custom_offering_interest, enterprise_interest, enterprise_team_size, enterprise_goal, enterprise_company, enterprise_phone';

const updateAssessmentIntent = async (patch) => {
  const sessionId = resolveAssessmentSessionId();

  let { data, error } = await supabase
    .from('ai_level_assessments')
    .update(patch)
    .eq('session_id', sessionId)
    .select(INTENT_SELECT_COLUMNS)
    .maybeSingle();

  if (!error && !data) {
    const assessmentDbId = sessionStorage.getItem(ASSESSMENT_DB_ID_KEY);
    if (assessmentDbId) {
      ({ data, error } = await supabase
        .from('ai_level_assessments')
        .update(patch)
        .eq('id', assessmentDbId)
        .select(INTENT_SELECT_COLUMNS)
        .maybeSingle());
    }
  }

  return { data, error, sessionId };
};

const LEADER_ROLE_KEYWORDS = /\b(lead|manager|manag|director|head|vp|svp|evp|avp|chief|founder|co-?founder|ceo|cto|coo|cfo|cmo|cpo|cro|cxo|president|owner|partner|principal|gm|general manager|managing director|entrepreneur|business owner)\b/i;

/** Client-side fallback when edge function is unavailable */
export const classifyLeaderRoleFallback = (role = '', persona = null) => {
  if (persona === 'founder') {
    return { prioritize_team_challenge: true, is_leader: true, classification: 'founder', method: 'persona' };
  }
  if (persona === 'student') {
    return { prioritize_team_challenge: false, is_leader: false, classification: 'student', method: 'persona' };
  }
  const isLeader = LEADER_ROLE_KEYWORDS.test(role);
  return {
    prioritize_team_challenge: isLeader,
    is_leader: isLeader,
    classification: isLeader ? 'leader' : 'individual',
    method: 'keyword',
  };
};

/** Classify job role + persona to decide team-challenge-first results layout */
export const classifyLeaderRole = async ({ role, persona, company }) => {
  const normalizedRole = (role || '').trim();
  if (!normalizedRole) {
    return classifyLeaderRoleFallback(normalizedRole, persona);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const { data, error } = await supabase.functions.invoke('classify-leader-role', {
      body: { role: normalizedRole, persona: persona || null, company: company || null },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (error || !data || typeof data.prioritize_team_challenge !== 'boolean') {
      console.log('🔄 Leader classification fallback:', error?.message || 'invalid response');
      return classifyLeaderRoleFallback(normalizedRole, persona);
    }

    console.log(`👔 Leader classified: ${data.classification} (team-first: ${data.prioritize_team_challenge})`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⏱️ Leader classification timeout, using keyword fallback');
    } else {
      console.error('❌ Leader classification exception:', err);
    }
    return classifyLeaderRoleFallback(normalizedRole, persona);
  }
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

  if (!shouldTrackAnalytics()) {
    console.log('🔇 Lead capture skipped (local dev)');
    return { success: true, skipped: true, data: leadData };
  }
  
  // Keep window global for backward compatibility during transition
  window.__aiLevelLead = leadData;
  
  try {
    // Get UTM attribution data and referral info
    const attribution = utmTracker.formatForDatabase();
    const referralId = utmTracker.getReferralId();
    console.log('🎯 Attribution data:', attribution);
    if (referralId) {
      console.log('🔗 Referral ID detected:', referralId);
    }

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
    
    // If user was referred by someone, credit the referral conversion
    if (referralId) {
      await utmTracker.creditReferralConversion(referralId, data);
    }
    
    return { success: true, data, attribution };
    
  } catch (err) {
    console.error('❌ Lead capture exception:', err);
    return { success: false, error: err };
  }
};

// Intent capture with Supabase integration (check for existing record first)
export const captureIntentData = async (intentData) => {
  console.log('💾 Capturing intent data:', intentData);

  if (!shouldTrackAnalytics()) {
    console.log('🔇 Intent capture skipped (local dev)');
    return { success: true, skipped: true };
  }

  // Keep window global for backward compatibility
  window.__aiLevelIntent = { ...(window.__aiLevelIntent || {}), ...intentData };

  try {
    const sessionId = resolveAssessmentSessionId();

    if (!sessionId) {
      console.warn('⚠️ No session_id found, skipping intent capture');
      return { success: false, error: 'No session_id found' };
    }

    // Build the update patch — only set columns to true, never reset to false
    const patch = {
      intent_captured_at: new Date().toISOString(),
      ...(intentData.prove ? { prove_interest: true } : {}),
      ...(intentData.improve ? { improve_interest: true } : {}),
      ...(intentData.customOffering ? { custom_offering_interest: true } : {}),
      ...(intentData.enterprise ? {
        enterprise_interest: true,
        enterprise_team_size: intentData.teamSize || null,
        enterprise_goal: intentData.goal || null,
        enterprise_company: intentData.company || null,
        enterprise_phone: intentData.phone || null,
      } : {}),
    };

    const { data, error, sessionId: resolvedSessionId } = await updateAssessmentIntent(patch);

    if (error) {
      console.error('❌ Intent capture error:', error);
      return { success: false, error };
    }

    if (!data) {
      console.warn('⚠️ No assessment row matched for intent capture', {
        sessionId: resolvedSessionId,
        assessmentDbId: sessionStorage.getItem(ASSESSMENT_DB_ID_KEY),
        intent: intentData,
      });
      return { success: false, error: 'assessment_not_found' };
    }

    persistAssessmentDbId(data.id);
    console.log('✅ Intent captured on assessment record:', data);
    return { success: true, data };

  } catch (err) {
    console.error('❌ Intent capture exception:', err);
    return { success: false, error: err };
  }
};

// Analytics event tracking
export const trackAnalyticsEvent = async (eventType, eventData = {}) => {
  if (!shouldTrackAnalytics()) {
    if (import.meta.env.DEV) {
      console.log(`🔇 Analytics skipped (local dev): ${eventType}`, eventData);
    }
    return { success: true, skipped: true };
  }

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

// Assessment table setup for new routing system
export const setupAssessmentTables = async () => {
  try {
    console.log('🔄 Setting up assessment tables...');

    // Create ai_level_assessments table
    const createAssessmentsTable = `
      CREATE TABLE IF NOT EXISTS ai_level_assessments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        
        -- Assessment data
        responses JSONB NOT NULL,
        scores JSONB NOT NULL,
        level INTEGER NOT NULL,
        relationship_status TEXT NOT NULL,
        insights JSONB,
        
        -- Timing data
        started_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ NOT NULL,
        
        -- Browser/device info
        user_agent TEXT,
        ip_address INET,
        
        -- Attribution data
        utm_data JSONB DEFAULT '{}',
        referrer TEXT,
        
        -- User linking (populated when user submits contact form)
        linked_lead_id UUID,
        linked_at TIMESTAMPTZ,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createAssessmentsTable });
    if (tableError) {
      console.error('Error creating assessments table:', tableError);
    }

    // Create indexes
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_level_assessments_session_id ON ai_level_assessments(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_ai_level_assessments_completed_at ON ai_level_assessments(completed_at);',
      'CREATE INDEX IF NOT EXISTS idx_ai_level_assessments_linked_lead_id ON ai_level_assessments(linked_lead_id);',
      'CREATE INDEX IF NOT EXISTS idx_ai_level_assessments_level ON ai_level_assessments(level);'
    ];

    for (const indexSql of createIndexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.warn('Warning creating index:', indexError);
      }
    }

    // Add assessment_id column to ai_level_leads if it doesn't exist
    const alterLeadsTable = `
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='ai_level_leads' AND column_name='assessment_id'
        ) THEN
          ALTER TABLE ai_level_leads ADD COLUMN assessment_id UUID;
          CREATE INDEX idx_ai_level_leads_assessment_id ON ai_level_leads(assessment_id);
        END IF;
      END $$;
    `;

    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterLeadsTable });
    if (alterError) {
      console.warn('Warning altering leads table:', alterError);
    }

    console.log('✅ Assessment tables setup completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Assessment tables setup failed:', error);
    return { success: false, error };
  }
};

export { supabase };