/**
 * State Management Utilities for Assessment Persistence
 * Handles localStorage, sessionStorage, and database state synchronization
 */

import { supabase, persistAssessmentDbId } from '../supabase.js';
import { utmTracker } from './utmTracker.js';
import { shouldTrackAnalytics } from './analyticsEnvironment.js';
import { isItem3Correct, isItem3bCorrect } from './questionOptions.js';

// Storage keys
const STORAGE_KEYS = {
  ASSESSMENT_STATE: 'ai-level-assessment-state',
  SESSION_ID: 'ai-level-session-id',
  VERSION: '1.1'
};

// Default state structure - Enhanced for adaptive assessment
const DEFAULT_STATE = {
  version: STORAGE_KEYS.VERSION,
  timestamp: Date.now(),
  
  navigation: {
    currentScreen: "landing",
    completedScreens: [],
    lastActiveUrl: "/",
    assessmentPath: null, // "A", "B", or "C"
    currentQuestionNumber: 0,
    totalQuestions: 0,
    history: [], // For score snapshots and back navigation
    skipReasons: {} // Track why certain questions were skipped
  },
  
  assessment: {
    startTime: null,
    completedAt: null,
    responses: {},
    optionOrder: {},

    // Original 6-component scoring system (maintained for compatibility)
    scores: {
      a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, b1: 0,
      item3Correct: false, item3bCorrect: false, item4Choice: null, item6Level: 1,
      item2Correct: 0, restraintScore: 0,
      apologyAnswer: null, allergyAnswer: null, promptLevel: 1,
    },
    
    // Enhanced 11-component scoring system
    enhancedScores: {
      // Core assessment scores (original)
      a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, b1: 0,
      
      // New behavioral and calibration scores
      behavFreqScore: 0,          // Behavioral frequency maturity
      dietScore: 0,               // AI tool usage breadth
      featureDepthScore: 0,       // Advanced feature utilization
      calibrationGap: 0,          // Self-assessment vs actual gap
      
      // Advanced question scores (Path C only)
      workflowScore: 0,           // Workflow design capability
      systemBuilderScore: 0,      // Multi-agent orchestration
      
      // Enhanced item scores
      item3bCorrect: false,       // Agreement trap detection
      item6Level: 1,              // Follow-up question sophistication
      
      // Score snapshots for back navigation
      snapshots: []
    },
    
    // Self-assessment and calibration
    calibration: {
      selfSelectedLevel: null,    // User's initial level estimation (0-5)
      actualLevel: null,          // Computed level after assessment
      perceptionGap: 0,           // Difference for sharing content
      overconfident: false        // Flag for overconfidence detection
    },
    
    // Enhanced user profiling
    profile: {
      role: null,                 // Professional role
      company: null,              // Company name
      persona: null,              // User persona/archetype
      useCase: null,              // Primary AI use case
      experience: null,           // AI experience level
      goals: []                   // Learning/improvement goals
    }
  },
  
  results: {
    level: null,
    relationshipStatus: null,
    insights: null,
    
    // Enhanced results data
    levelBreakdown: {
      phase: null,                // Tool User, Co-worker, System Builder
      percentile: null,           // "Top X% of users"
      strengths: [],              // Areas of strength
      improvements: [],           // Areas for improvement
      nextLevel: null             // Next level guidance
    },
    
    // Detailed personality assessment
    personality: {
      archetype: null,            // One of 8 relationship archetypes
      traits: [],                 // Personality traits identified
      workStyle: null,            // How they work with AI
      riskProfile: null           // Risk tolerance with AI
    }
  },
  
  user: {
    leadData: null,
    leadId: null
  },
  
  analytics: {
    sessionId: null,
    firedEvents: [],
    utmData: {},
    sessionReplayUrl: null,
    
    // Enhanced analytics for adaptive assessment
    assessmentMetrics: {
      pathTaken: null,            // A, B, or C
      questionsAnswered: 0,       // Total questions completed
      timeSpent: {},              // Time per question
      backNavigationCount: 0,     // How many times user went back
      autoAdvanceCount: 0,        // How many auto-advances occurred
      calibrationAccuracy: null   // How accurate was self-assessment
    }
  }
};

/**
 * Get or create session ID
 * @returns {string} Session ID
 */
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
};

/**
 * Save assessment state to localStorage and sessionStorage
 * @param {Object} state - Assessment state object
 */
export const saveAssessmentState = (state) => {
  try {
    const stateToSave = {
      ...state,
      timestamp: Date.now(),
      analytics: {
        ...state.analytics,
        sessionId: getSessionId()
      }
    };

    // Save to both storages for redundancy
    localStorage.setItem(STORAGE_KEYS.ASSESSMENT_STATE, JSON.stringify(stateToSave));
    sessionStorage.setItem(STORAGE_KEYS.ASSESSMENT_STATE, JSON.stringify(stateToSave));
    
    console.log('🔄 State saved to local storage');
    return true;
  } catch (error) {
    console.error('❌ Failed to save assessment state:', error);
    return false;
  }
};

/**
 * Save complete assessment data to database
 * @param {Object} state - Complete assessment state
 * @returns {Promise<Object>} Database result
 */
export const saveAssessmentToDatabase = async (state) => {
  if (!shouldTrackAnalytics()) {
    if (import.meta.env.DEV) {
      console.log('🔇 Assessment DB save skipped (local dev)');
    }
    return { success: true, skipped: true };
  }

  try {
    const sessionId = state.analytics?.sessionId || getSessionId();
    if (state.analytics?.sessionId) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    console.log('🔄 Saving assessment to database for session:', sessionId);
    
    // Get UTM data for attribution
    const utmData = utmTracker.formatForDatabase();
    
    const assessmentRecord = {
      session_id: sessionId,
      responses: state.assessment.responses,
      scores: state.assessment.scores,
      level: state.results.level,
      relationship_status: state.results.relationshipStatus,
      insights: state.results.insights,
      started_at: new Date(state.assessment.startTime).toISOString(),
      completed_at: new Date(state.assessment.completedAt || Date.now()).toISOString(),
      user_agent: navigator.userAgent,
      utm_data: utmData,
      referrer: document.referrer || null
    };

    const { data, error } = await supabase
      .from('ai_level_assessments')
      .upsert([assessmentRecord], { onConflict: 'session_id' })
      .select()
      .single();

    if (error) {
      // Handle 406 error specifically - table might not be ready
      if (error.code === '406' || error.message.includes('Not Acceptable')) {
        console.warn('⚠️ Assessment table not ready in PostgREST API, data will be saved locally only');
        return { success: false, error: 'table_not_ready', message: 'Database table not accessible via API' };
      }
      
      console.error('❌ Failed to save assessment to database:', error);
      return { success: false, error };
    }

    console.log('✅ Assessment saved to database:', data.id);
    persistAssessmentDbId(data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception saving assessment to database:', error);
    return { success: false, error };
  }
};

/**
 * Update an existing assessment record with the user's contact details
 * Called after the contact form is submitted to patch the session row.
 * @param {string} sessionId - Session identifier
 * @param {Object} contactData - { name, phone, email }
 * @returns {Promise<Object>} Result
 */
export const updateAssessmentWithContact = async (sessionId, contactData) => {
  if (!shouldTrackAnalytics()) {
    if (import.meta.env.DEV) {
      console.log('🔇 Assessment contact update skipped (local dev)');
    }
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await supabase
      .from('ai_level_assessments')
      .update({
        user_name:  contactData.name,
        user_phone: contactData.phone,
        user_email: contactData.email || null,
        referral_id: contactData.referralId || null,
        referred_by: contactData.referredBy || null,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update assessment with contact:', error);
      return { success: false, error };
    }

    console.log('✅ Assessment updated with contact details:', data.id);
    persistAssessmentDbId(data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception updating assessment with contact:', error);
    return { success: false, error };
  }
};

/**
 * Load assessment state from storage (localStorage -> sessionStorage -> database)
 * @returns {Promise<Object>} Assessment state or default state
 */
export const loadAssessmentState = async () => {
  try {
    // Try localStorage first
    const localData = localStorage.getItem(STORAGE_KEYS.ASSESSMENT_STATE);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (validateStateIntegrity(parsed)) {
        console.log('🔄 State loaded from localStorage');
        return parsed;
      }
    }

    // Try sessionStorage
    const sessionData = sessionStorage.getItem(STORAGE_KEYS.ASSESSMENT_STATE);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (validateStateIntegrity(parsed)) {
        console.log('🔄 State loaded from sessionStorage');
        return parsed;
      }
    }

    // Try database using session ID
    const sessionId = getSessionId();
    const dbState = await loadStateFromDatabase(sessionId);
    if (dbState) {
      console.log('🔄 State loaded from database');
      return dbState;
    }

    // Return default state
    console.log('🔄 Using default state');
    return {
      ...DEFAULT_STATE,
      analytics: {
        ...DEFAULT_STATE.analytics,
        sessionId: getSessionId(),
        utmData: utmTracker.formatForDatabase()
      }
    };
  } catch (error) {
    console.error('❌ Failed to load assessment state:', error);
    return {
      ...DEFAULT_STATE,
      analytics: {
        ...DEFAULT_STATE.analytics,
        sessionId: getSessionId()
      }
    };
  }
};

/**
 * Load state from database using session ID
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object|null>} State from database or null
 */
const loadStateFromDatabase = async (sessionId) => {
  try {
    console.log('🔍 Attempting to load state from database for session:', sessionId);
    
    const { data, error } = await supabase
      .from('ai_level_assessments')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle(); // Use maybeSingle to avoid error when no records found

    if (error) {
      // Handle 406 error specifically - table might not be ready in PostgREST
      if (error.code === '406' || error.message.includes('Not Acceptable')) {
        console.log('🔄 Table not ready in PostgREST API, skipping database load');
        return null;
      }
      console.error('❌ Database query error:', error);
      return null;
    }

    if (!data) {
      console.log('🔍 No assessment data found in database for session:', sessionId);
      return null;
    }

    console.log('✅ Assessment data loaded from database');

    // Convert database record back to state format
    return {
      version: STORAGE_KEYS.VERSION,
      timestamp: Date.now(),
      navigation: {
        currentScreen: "results", // If in DB, assessment is complete
        completedScreens: ["landing", "item1", "item1_reveal", "item2", "item2_reveal", 
                          "item3", "item3_reveal", "item4", "item4_reveal", 
                          "item5a", "item5a_reveal", "item5b", "item5b_reveal", "item6", "loading"],
        lastActiveUrl: "/assessment/results"
      },
      assessment: {
        startTime: new Date(data.started_at).getTime(),
        completedAt: new Date(data.completed_at).getTime(),
        responses: data.responses,
        scores: data.scores
      },
      results: {
        level: data.level,
        relationshipStatus: data.relationship_status,
        insights: data.insights
      },
      user: {
        leadData: null, // Will be populated if linked
        leadId: data.linked_lead_id
      },
      analytics: {
        sessionId: sessionId,
        firedEvents: [],
        utmData: data.utm_data || {},
        sessionReplayUrl: null
      }
    };
  } catch (error) {
    console.error('❌ Failed to load state from database:', error);
    return null;
  }
};

/**
 * Link assessment to user record when they submit contact details
 * @param {string} sessionId - Session identifier
 * @param {Object} leadData - User contact information
 * @returns {Promise<Object>} Link result
 */
export const linkAssessmentToUser = async (sessionId, leadData) => {
  try {
    // Update the assessment record with lead ID
    const { data: assessment, error: updateError } = await supabase
      .from('ai_level_assessments')
      .update({
        linked_lead_id: leadData.id,
        linked_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to link assessment to user:', updateError);
      return { success: false, error: updateError };
    }

    // Update the lead record with assessment ID
    const { error: leadUpdateError } = await supabase
      .from('ai_level_leads')
      .update({ assessment_id: assessment.id })
      .eq('id', leadData.id);

    if (leadUpdateError) {
      console.error('❌ Failed to update lead with assessment ID:', leadUpdateError);
    }

    console.log('✅ Assessment linked to user:', leadData.id);
    return { success: true, data: assessment };
  } catch (error) {
    console.error('❌ Exception linking assessment to user:', error);
    return { success: false, error };
  }
};

/**
 * Clear assessment state from all storage locations
 */
export const clearAssessmentState = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ASSESSMENT_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.ASSESSMENT_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    console.log('🗑️ Assessment state cleared');
  } catch (error) {
    console.error('❌ Failed to clear assessment state:', error);
  }
};

/**
 * Start a fresh assessment session (clears stored progress and creates new session ID)
 * @returns {string} New session ID
 */
export const startNewSession = () => {
  clearAssessmentState();
  sessionStorage.removeItem('ai-level-lead-id');
  delete window.__assessmentStartTime;
  return getSessionId();
};

/**
 * Validate state data integrity
 * @param {Object} state - State object to validate
 * @returns {boolean} True if state is valid
 */
export const validateStateIntegrity = (state) => {
  try {
    // Check basic structure
    if (!state || typeof state !== 'object') return false;
    if (!state.navigation || !state.assessment || !state.analytics) return false;
    
    // Check required fields
    if (!state.navigation.currentScreen) return false;
    if (!Array.isArray(state.navigation.completedScreens)) return false;
    if (!state.analytics.sessionId) return false;
    
    // Reject stale state — in-progress sessions reset on version bump
    if (state.version && state.version !== STORAGE_KEYS.VERSION) {
      console.warn('⚠️ State version mismatch, discarding stale session');
      return false;
    }
    
    // Check timestamp freshness (warn if older than 7 days)
    const ageHours = (Date.now() - state.timestamp) / (1000 * 60 * 60);
    if (ageHours > 24 * 7) {
      console.warn('⚠️ State is older than 7 days');
    }
    
    return true;
  } catch (error) {
    console.error('❌ State validation failed:', error);
    return false;
  }
};

/**
 * Migrate state from older version to current version
 * @param {Object} oldState - State from previous version
 * @returns {Object} Migrated state
 */
export const migrateStateVersion = (oldState) => {
  try {
    // For now, return default state structure with preserved data
    // In future, implement specific migration logic based on version
    return {
      ...DEFAULT_STATE,
      ...oldState,
      version: STORAGE_KEYS.VERSION,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('❌ State migration failed:', error);
    return DEFAULT_STATE;
  }
};

/**
 * Get current assessment progress as percentage
 * @param {Object} state - Assessment state
 * @returns {number} Progress percentage (0-100)
 */
export const getAssessmentProgress = (state) => {
  const totalSteps = 14; // Total assessment screens
  const completedSteps = state.navigation.completedScreens.length;
  return Math.min(Math.round((completedSteps / totalSteps) * 100), 100);
};

/**
 * Check if assessment is complete
 * @param {Object} state - Assessment state
 * @returns {boolean} True if assessment is complete
 */
export const isAssessmentComplete = (state) => {
  const requiredScreens = ['item1', 'item2', 'item3', 'item4', 'item5a', 'item5b', 'item6'];
  return requiredScreens.every(screen => state.navigation.completedScreens.includes(screen));
};

/**
 * Check if user can access a specific screen
 * @param {string} screen - Screen name to check
 * @param {Object} state - Current assessment state
 * @returns {boolean} True if user can access the screen
 */
export const canAccessScreen = (screen, state) => {
  // Landing page is always accessible
  if (screen === 'landing') return true;
  
  // Enhanced assessment components - always accessible as they're the new starting flow
  const enhancedStartingScreens = ['selfSelect', 'context', 'behavioralFreq', 'aiDiet'];
  if (enhancedStartingScreens.includes(screen)) return true;
  
  // Check item reveal screens
  if (screen.includes('_reveal')) {
    const itemName = screen.replace('_reveal', '');
    return state.navigation.completedScreens.includes(itemName);
  }
  
  // Path-aware access control for advanced questions — must come before sequential check
  const path = state.navigation?.assessmentPath;
  
  // Item3b only accessible on Path B and C
  if (screen === 'item3b') {
    return ['B', 'C'].includes(path) && state.navigation.completedScreens.includes('item3_reveal');
  }

  // Item4: Path A skips item3b; Path B/C require item3b first
  if (screen === 'item4') {
    if (path === 'A') {
      return state.navigation.completedScreens.includes('item3');
    }
    if (['B', 'C'].includes(path)) {
      return state.navigation.completedScreens.includes('item3b_reveal')
        || state.navigation.completedScreens.includes('item3b');
    }
  }
  
  // WorkflowDesign: Path C only, comes BEFORE item6 (after item5b_reveal)
  if (screen === 'workflowDesign') {
    return path === 'C' && state.navigation.completedScreens.includes('item5b_reveal');
  }
  
  // SystemBuilder: Path C only, comes after workflowDesign reveal
  if (screen === 'systemBuilder') {
    return path === 'C' && state.navigation.completedScreens.includes('workflowDesign_reveal');
  }

  // Enhanced sequential access for core assessment flow
  const enhancedItemOrder = [
    'selfSelect', 'context', 'behavioralFreq', 'aiDiet',
    'item1', 'item2', 'item3', 'item3b', 'item4', 'item5a', 'item5b', 'item6'
  ];
  
  const currentIndex = enhancedItemOrder.indexOf(screen);
  
  if (currentIndex === 0) return true; // selfSelect is always accessible
  if (currentIndex > 0) {
    // Check if previous item was completed
    const previousItem = enhancedItemOrder[currentIndex - 1];
    return state.navigation.completedScreens.includes(previousItem);
  }
  
  // Legacy item order support for backward compatibility
  const legacyItemOrder = ['item1', 'item2', 'item3', 'item4', 'item5a', 'item5b', 'item6'];
  const legacyIndex = legacyItemOrder.indexOf(screen);
  
  if (legacyIndex === 0) return true; // item1 is accessible after enhanced flow
  if (legacyIndex > 0) {
    // Check if previous item's reveal screen was completed
    const previousItem = legacyItemOrder[legacyIndex - 1];
    return state.navigation.completedScreens.includes(`${previousItem}_reveal`);
  }
  
  // Check processing, capture, and results screens
  if (screen === 'loading') {
    return isAssessmentComplete(state);
  }
  
  if (screen === 'capture') {
    return isAssessmentComplete(state) && state.results.level !== null;
  }
  
  if (screen === 'reveal') {
    return state.user.leadData !== null;
  }
  
  return false;
};

/**
 * Score Snapshots System for back navigation
 */
export const ScoreSnapshots = {
  takeSnapshot(state) {
    return {
      timestamp: Date.now(),
      screen: state.navigation.currentScreen,
      scores: { ...state.assessment.enhancedScores },
      responses: { ...state.assessment.responses },
      questionNumber: state.navigation.currentQuestionNumber
    };
  },

  saveSnapshot(state, snapshot) {
    return {
      ...state,
      assessment: {
        ...state.assessment,
        enhancedScores: {
          ...state.assessment.enhancedScores,
          snapshots: [...state.assessment.enhancedScores.snapshots, snapshot]
        }
      }
    };
  },

  restoreLastSnapshot(state) {
    const snapshots = state.assessment.enhancedScores.snapshots;
    if (snapshots.length === 0) return state;
    
    const lastSnapshot = snapshots[snapshots.length - 1];
    
    return {
      ...state,
      assessment: {
        ...state.assessment,
        enhancedScores: {
          ...lastSnapshot.scores,
          snapshots: snapshots.slice(0, -1) // Remove the restored snapshot
        },
        responses: lastSnapshot.responses
      },
      navigation: {
        ...state.navigation,
        currentScreen: lastSnapshot.screen,
        currentQuestionNumber: lastSnapshot.questionNumber
      }
    };
  }
};

/**
 * Adaptive Path Determination Logic
 */
export const PathLogic = {
  determinePath(state) {
    const { selfSelectedLevel } = state.assessment.calibration;
    const { dietScore, featureDepthScore } = state.assessment.enhancedScores;
    
    // Path A: Basic users (L0-L2)
    if (selfSelectedLevel <= 1 && dietScore <= 1) {
      return { 
        path: "A", 
        totalQuestions: 8,
        skipQuestions: ["item3b", "workflowDesign", "systemBuilder"],
        description: "Essential Assessment"
      };
    }
    
    // Path C: Expert users (L4-L5+ aspirational)  
    if (selfSelectedLevel >= 3 && (dietScore >= 2 || featureDepthScore >= 2)) {
      return { 
        path: "C", 
        totalQuestions: 12,
        skipQuestions: [],
        description: "Advanced Professional Assessment"
      };
    }
    
    // Path B: Standard users (L2-L4)
    return { 
      path: "B", 
      totalQuestions: 10,
      skipQuestions: ["workflowDesign", "systemBuilder"],
      description: "Complete Assessment"
    };
  },

  getQuestionFlow(path) {
    const flows = {
      "A": [ // Basic Path - 8 questions
        "selfSelect", "context", "behavioralFreq", "aiDiet",
        "item1", "item2", "item3", "item4", "item5a", "item5b", "item6"
      ],
      
      "B": [ // Standard Path - 10 questions
        "selfSelect", "context", "behavioralFreq", "aiDiet", 
        "item1", "item2", "item3", "item3b", "item4", "item5a", "item5b", "item6"
      ],
      
      "C": [ // Expert Path - 12 questions
        "selfSelect", "context", "behavioralFreq", "aiDiet",
        "item1", "item2", "item3", "item3b", "item4", "item5a", "item5b", "item6",
        "workflowDesign", "systemBuilder"
      ]
    };
    
    return flows[path] || flows["B"];
  },

  shouldSkipQuestion(questionName, path) {
    const pathInfo = this.determinePath({ 
      assessment: { 
        calibration: { selfSelectedLevel: 3 },
        enhancedScores: { dietScore: 2, featureDepthScore: 2 }
      }
    });
    return pathInfo.skipQuestions.includes(questionName);
  }
};

/**
 * Merge score buckets for level computation. Defaults duplicated in enhancedScores
 * (e.g. a1–a5, item6Level) must not overwrite real values written to assessment.scores.
 */
export function mergeAssessmentScores(assessment) {
  if (!assessment) return {};
  const scores = assessment.scores || {};
  const enhanced = assessment.enhancedScores || {};
  const merged = { ...enhanced, ...scores };
  // Legacy handlers wrote these on assessment root while scores kept defaults — prefer root when set
  const legacyKeys = [
    'item2Correct',
    'item3Correct',
    'item3bCorrect',
    'item4Choice',
    'restraintScore',
    'apologyAnswer',
    'allergyAnswer',
  ];
  for (const key of legacyKeys) {
    const v = assessment[key];
    if (v !== undefined) merged[key] = v;
  }
  return merged;
}

/** Sum a1+a2+a3+a4+a5 — same definition as EnhancedScoring.computeLevel primary total. */
export function getAssessmentPrimaryTotal(mergedScores) {
  const a1 = Number(mergedScores?.a1) || 0;
  const a2 = Number(mergedScores?.a2) || 0;
  const a3 = Number(mergedScores?.a3) || 0;
  const a4 = Number(mergedScores?.a4) || 0;
  const a5 = Number(mergedScores?.a5) || 0;
  return a1 + a2 + a3 + a4 + a5;
}

/**
 * Enhanced Level Calculation Algorithm
 */
export const EnhancedScoring = {
  computeLevel(scores, path, responses = {}) {
    const {
      a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0
    } = scores;
    const total = a1 + a2 + a3 + a4 + a5;
    
    const item3Correct = scores.item3Correct !== undefined
      ? scores.item3Correct
      : isItem3Correct(responses.item3?.choice);
    const item4Choice = scores.item4Choice || responses.item4?.choice;
    
    const item6Level = scores.item6Level || 0;
    const behavFreq = scores.behavFreqScore || 0;
    const dietScore = scores.dietScore || 0;
    const workflowScore = scores.workflowScore || 0;
    const systemBuilderScore = scores.systemBuilderScore || 0;
    const featureDepth = scores.featureDepthScore || 0;

    // L0: Very low engagement / scores + no AI usage
    if (total <= 4 && dietScore === 0) return 0;
    if (total <= 4) return 0;
    // L1: Low total, limited understanding
    if (total <= 7) return 1;
    // L2 ceiling: Artifact Effect gatekeeper — wrong on Item 3 caps at L2
    // Also: accepting or polishing AI output (A/B on Item 4) caps at L2
    if (!item3Correct || item4Choice === "A" || item4Choice === "B") return 2;
    // L5: Path C — strong workflow design + system builder + all previous gates passed
    if (workflowScore >= 3 && systemBuilderScore >= 3 && total >= 18 && item6Level >= 3 && featureDepth >= 3) return 5;
    // L4: High total + deep follow-up + passed all gatekeepers + strong behavioral/tool signals
    if (total >= 18 && item6Level >= 3 && (behavFreq >= 3 || dietScore >= 3)) return 4;
    if (total >= 18 && item6Level >= 3) return 4;
    // L4 also reachable via Path C with moderate workflow/system scores
    if (workflowScore >= 2 && systemBuilderScore >= 2 && total >= 14 && item3Correct) return 4;
    // L3: Passed gatekeepers (Item 3 correct, Item 4 C/D)
    if (item3Correct && (item4Choice === "C" || item4Choice === "D")) return 3;
    return 2;
  },

  computeRelationshipStatus(scores, level, responses = {}) {
    const item3Correct = scores.item3Correct !== undefined
      ? scores.item3Correct
      : isItem3Correct(responses.item3?.choice);
    const item3bCorrect = scores.item3bCorrect !== undefined
      ? scores.item3bCorrect
      : isItem3bCorrect(responses.item3b);
    const item4Choice = scores.item4Choice || responses.item4?.choice;
    const restraintScore = scores.restraintScore !== undefined ? scores.restraintScore : 0;
    
    const petSignals = [
      !item3Correct,
      restraintScore === 0,
      item4Choice === "A",
      (scores.behavFreqScore || 0) <= 1,
    ].filter(Boolean).length;

    const colleagueSignals = [
      item3Correct,
      item3bCorrect,
      item4Choice === "C" || item4Choice === "D",
      restraintScore >= 2,
      (scores.item6Level || 0) >= 3,
      (scores.behavFreqScore || 0) >= 3,
      (scores.dietScore || 0) >= 3,
    ].filter(Boolean).length;

    if (level >= 3 && petSignals >= 2) return "complicated";
    if (level <= 1 && colleagueSignals >= 3) return "complicated";
    if (level >= 4 && colleagueSignals >= 5) return "merged";
    if (level >= 3 && colleagueSignals >= 4) return "merged";
    if (colleagueSignals >= 3 && level >= 2) return "committed";
    if (level === 0 && (scores.dietScore || 0) === 0) return "single";
    if (level === 0) return "casual";
    if (petSignals >= 3) return "complicated";
    return "casual";
  },

  calculateCalibrationGap(selfSelected, actual) {
    return actual - selfSelected;
  },

  isOverconfident(selfSelected, actual) {
    return selfSelected > actual + 1; // More than 1 level overestimated
  }
};

export default {
  saveAssessmentState,
  saveAssessmentToDatabase,
  updateAssessmentWithContact,
  loadAssessmentState,
  linkAssessmentToUser,
  clearAssessmentState,
  startNewSession,
  validateStateIntegrity,
  migrateStateVersion,
  getAssessmentProgress,
  isAssessmentComplete,
  canAccessScreen,
  getSessionId,
  ScoreSnapshots,
  PathLogic,
  EnhancedScoring,
  mergeAssessmentScores,
  getAssessmentPrimaryTotal
};