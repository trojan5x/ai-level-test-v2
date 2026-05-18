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

  // Keep window global for backward compatibility
  window.__aiLevelIntent = { ...(window.__aiLevelIntent || {}), ...intentData };

  try {
    // Resolve session_id — prefer the persistent key used by stateManager
    const sessionId =
      localStorage.getItem('ai-level-session-id') ||
      sessionStorage.getItem('ai-level-session-id') ||
      getSessionId();

    if (!sessionId) {
      console.warn('⚠️ No session_id found, skipping intent capture');
      return { success: false, error: 'No session_id found' };
    }

    // Build the update patch — only set columns to true, never reset to false
    const patch = {
      intent_captured_at: new Date().toISOString(),
      ...(intentData.prove   ? { prove_interest:   true } : {}),
      ...(intentData.improve ? { improve_interest: true } : {}),
    };

    const { data, error } = await supabase
      .from('ai_level_assessments')
      .update(patch)
      .eq('session_id', sessionId)
      .select('id, prove_interest, improve_interest')
      .single();

    if (error) {
      console.error('❌ Intent capture error:', error);
      return { success: false, error };
    }

    console.log('✅ Intent captured on assessment record:', data);
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