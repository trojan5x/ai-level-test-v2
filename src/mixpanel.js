import mixpanel from 'mixpanel-browser';
import { shouldTrackAnalytics } from './utils/analyticsEnvironment.js';

// Mixpanel configuration
const MIXPANEL_TOKEN = '9d9097ced8abd777d1517ac47f4c1129';

function trackMixpanel(eventName, properties = {}) {
  if (!shouldTrackAnalytics()) {
    if (import.meta.env.DEV) {
      console.log(`🔇 Mixpanel skipped (local dev): ${eventName}`, properties);
    }
    return;
  }

  mixpanel.track(eventName, properties);
}

// Initialize Mixpanel
mixpanel.init(MIXPANEL_TOKEN, {
  debug: import.meta.env.DEV, // Enable debug in development
  track_pageview: false, // We'll track page views manually
  persistence: 'localStorage', // Use localStorage for persistence
  property_blacklist: ['$current_url'], // Exclude sensitive properties
  ignore_dnt: false, // Respect Do Not Track
  
  // Session Replay Configuration
  record_sessions_percent: 100, // Record 100% of sessions (adjust for production)
  record_block_class: 'mp-sensitive', // Block elements with this class
  record_collect_fonts: true, // Collect fonts for better replay quality
  record_idle_timeout_ms: 5 * 60 * 1000, // Stop recording after 5 minutes of inactivity
  record_max_ms: 15 * 60 * 1000, // Maximum recording length: 15 minutes
});

// Set super properties (auto-added to all events)
mixpanel.register({
  platform: 'web',
  user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  app_version: '1.0',
});

// Start session replay explicitly (called when user starts assessment)
export const startSessionRecording = () => {
  if (!shouldTrackAnalytics()) return;

  mixpanel.start_session_recording();
  
  if (import.meta.env.DEV) {
    console.log('🎬 Mixpanel: Session recording started');
  }
};

// Stop session replay (optional - called if needed)
export const stopSessionRecording = () => {
  mixpanel.stop_session_recording();
  
  if (import.meta.env.DEV) {
    console.log('🎬 Mixpanel: Session recording stopped');
  }
};

// Get session replay URL (useful for debugging or customer support)
export const getSessionReplayUrl = () => {
  const url = mixpanel.get_session_replay_url();
  
  if (import.meta.env.DEV) {
    console.log('🎬 Mixpanel: Session replay URL:', url);
  }
  
  return url;
};

// Track page view with UTM parameters
export const trackPageView = (pageName, properties = {}) => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const pageViewProperties = {
    page_name: pageName,
    referrer: document.referrer || 'direct',
    landing_url: window.location.href,
    ...properties
  };

  // Add UTM parameters if available
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmParams.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      pageViewProperties[param] = value;
    }
  });

  trackMixpanel('landing_page_viewed', pageViewProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: landing_page_viewed', pageViewProperties);
  }
};

// Track assessment started
export const trackAssessmentStarted = (properties = {}) => {
  const eventProperties = {
    platform: 'web',
    ...properties
  };

  // Start session recording when user begins assessment
  startSessionRecording();

  trackMixpanel('assessment_started', eventProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_started', eventProperties);
  }
};

// Track assessment completed
export const trackAssessmentCompleted = (score, level, rating, properties = {}) => {
  const eventProperties = {
    assessment_score: Number(score), // Ensure it's a number
    assessment_level: level,
    assessment_rating: rating,
    platform: 'web',
    ...properties
  };

  trackMixpanel('assessment_completed', eventProperties);
  
  // Add session replay annotation for assessment completion
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'milestone',
    event: 'assessment_completed',
    user_level: level,
    user_score: Number(score)
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_completed', eventProperties);
    console.log('🎬 Mixpanel: Session replay annotated - Assessment completed');
  }
};

// Track lead form completed (VALUE MOMENT)
export const trackLeadFormCompleted = (userData, assessmentData, properties = {}) => {
  const eventProperties = {
    signup_method: 'assessment',
    platform: 'web',
    assessment_score: Number(assessmentData.score),
    assessment_level: assessmentData.level,
    ...properties
  };

  trackMixpanel('lead_form_completed', eventProperties);
  
  // Add session replay annotation for this key conversion event
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'conversion',
    event: 'lead_form_completed',
    user_level: assessmentData.level,
    user_score: Number(assessmentData.score)
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: lead_form_completed', eventProperties);
    console.log('🎬 Mixpanel: Session replay annotated - Lead conversion');
  }
};

// Track result page viewed
export const trackResultPageViewed = (assessmentData, properties = {}) => {
  const eventProperties = {
    assessment_score: Number(assessmentData.score),
    assessment_level: assessmentData.level,
    platform: 'web',
    ...properties
  };

  trackMixpanel('result_page_viewed', eventProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: result_page_viewed', eventProperties);
  }
};

// Track CTA clicked
export const trackCTAClicked = (ctaType, ctaText, ctaPosition = 'primary', assessmentData, properties = {}) => {
  const reservationCta =
    ctaType === 'prove'
      ? 'prove_reserved'
      : ctaType === 'improve'
        ? 'improve_reserved'
        : undefined;

  const eventProperties = {
    cta_type: ctaType,
    cta_text: ctaText,
    cta_position: ctaPosition,
    platform: 'web',
    user_score: Number(assessmentData.score),
    user_level: assessmentData.level,
    ...(reservationCta ? { reservation_cta: reservationCta } : {}),
    ...properties
  };

  trackMixpanel('cta_clicked', eventProperties);
  
  // Add session replay annotation for CTA interactions
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'interaction',
    event: 'cta_clicked',
    cta_type: ctaType,
    user_level: assessmentData.level,
    ...(reservationCta ? { reservation_cta: reservationCta } : {})
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: cta_clicked', eventProperties);
    console.log(`🎬 Mixpanel: Session replay annotated - CTA clicked (${ctaType})`);
  }
};

// Identify user and set profile properties
export const identifyUser = (userData, assessmentData) => {
  // Use email as distinct_id for user identification
  mixpanel.identify(userData.email);
  
  // Set user profile properties
  mixpanel.people.set({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    latest_assessment_score: Number(assessmentData.score),
    latest_assessment_level: assessmentData.level,
    signup_date: new Date().toISOString(),
    $timezone: 'Asia/Kolkata'
  });

  // Increment assessment counter
  mixpanel.people.increment('total_assessments', 1);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: User identified', userData.email, {
      name: userData.name,
      latest_score: assessmentData.score,
      latest_level: assessmentData.level
    });
  }
};

// Reset user (for logout - if needed in future)
export const resetUser = () => {
  mixpanel.reset();
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: User reset');
  }
};

// LinkedIn badge share funnel (distinct names from legacy linkedin_share_* events)
export const trackShareAttempted = (properties = {}) => {
  const eventProperties = {
    share_channel: 'linkedin',
    platform: 'web',
    ...properties
  };

  trackMixpanel('share_attempted', eventProperties);

  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: share_attempted', eventProperties);
  }
};

export const trackShareCompleted = (referralId, shareData = {}) => {
  const eventProperties = {
    share_channel: 'linkedin',
    referral_id: referralId,
    platform: 'web',
    assessment_score: Number(shareData.score),
    assessment_level: shareData.level,
    relationship_status: shareData.relationshipStatus,
    ...getTimestampProperties()
  };

  if (shareData.post_id) eventProperties.post_id = shareData.post_id;
  if (shareData.post_url) eventProperties.post_url = shareData.post_url;

  trackMixpanel('share_completed', eventProperties);

  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: share_completed', eventProperties);
  }
};

export const trackChallengeSent = (properties = {}) => {
  const eventProperties = {
    platform: 'web',
    ...properties
  };

  trackMixpanel('challenge_sent', eventProperties);

  trackMixpanel('session_replay_annotation', {
    annotation_type: 'interaction',
    event: 'challenge_sent',
    challenge_channel: properties.challenge_channel,
    user_level: properties.assessment_level
  });

  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: challenge_sent', eventProperties);
  }
};

// Generic event tracking (fallback)
export const trackEvent = (eventName, properties = {}) => {
  trackMixpanel(eventName, properties);
  
  if (import.meta.env.DEV) {
    console.log(`🔍 Mixpanel: ${eventName}`, properties);
  }
};

// LinkedIn Sharing Analytics Functions

// Track LinkedIn share button click
export const trackLinkedInShareInitiated = (referralId, userContext = {}) => {
  const eventProperties = {
    referral_id: referralId,
    platform: 'web',
    user_level: userContext.level,
    user_score: userContext.score,
    relationship_status: userContext.relationshipStatus,
    ...getTimestampProperties()
  };
  
  trackMixpanel('linkedin_share_initiated', eventProperties);
  
  // Annotate session replay
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'interaction',
    event: 'linkedin_share_initiated',
    referral_id: referralId,
    user_level: userContext.level
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: linkedin_share_initiated', eventProperties);
    console.log('🎬 Mixpanel: Session replay annotated - LinkedIn Share Initiated');
  }
};

// Track LinkedIn OAuth redirect start
export const trackLinkedInOAuthStarted = (referralId, redirectUri) => {
  const eventProperties = {
    referral_id: referralId,
    redirect_uri: redirectUri,
    platform: 'web',
    ...getTimestampProperties()
  };
  
  trackMixpanel('linkedin_oauth_started', eventProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: linkedin_oauth_started', eventProperties);
  }
};

// Track successful OAuth callback
export const trackLinkedInOAuthCompleted = (referralId, authData = {}) => {
  const eventProperties = {
    referral_id: referralId,
    platform: 'web',
    auth_success: true,
    ...getTimestampProperties()
  };
  
  trackMixpanel('linkedin_oauth_completed', eventProperties);
  
  // Annotate session replay
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'milestone',
    event: 'linkedin_oauth_completed',
    referral_id: referralId
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: linkedin_oauth_completed', eventProperties);
    console.log('🎬 Mixpanel: Session replay annotated - LinkedIn OAuth Completed');
  }
};

// Track successful LinkedIn post creation
export const trackLinkedInShareCompleted = (referralId, shareData = {}) => {
  const eventProperties = {
    referral_id: referralId,
    platform: 'web',
    post_id: shareData.post_id || null,
    post_url: shareData.post_url || null,
    user_level: shareData.level,
    user_score: shareData.score,
    relationship_status: shareData.relationshipStatus,
    ...getTimestampProperties()
  };
  
  trackMixpanel('linkedin_share_completed', eventProperties);
  
  // Annotate session replay with conversion
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'conversion',
    event: 'linkedin_share_completed',
    referral_id: referralId,
    user_level: shareData.level,
    post_url: shareData.post_url
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: linkedin_share_completed', eventProperties);
    console.log('🎬 Mixpanel: Session replay annotated - LinkedIn Share Completed');
  }
};

// Track LinkedIn sharing failures
export const trackLinkedInShareFailed = (referralId, errorData = {}) => {
  const eventProperties = {
    referral_id: referralId,
    platform: 'web',
    error_type: errorData.error || 'unknown',
    error_message: errorData.message || 'Unknown error',
    error_stage: errorData.stage || 'unknown', // 'oauth', 'api', 'upload', etc.
    retry_possible: errorData.shouldRetry || false,
    ...getTimestampProperties()
  };
  
  trackMixpanel('linkedin_share_failed', eventProperties);
  
  // Annotate session replay with error
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'error',
    event: 'linkedin_share_failed',
    referral_id: referralId,
    error: errorData.error,
    stage: errorData.stage
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: linkedin_share_failed', eventProperties);
    console.log('🎬 Mixpanel: Session replay annotated - LinkedIn Share Failed');
  }
};

// Track referral link generation
export const trackReferralLinkGenerated = (referralId, userContext = {}) => {
  const eventProperties = {
    referral_id: referralId,
    user_name_prefix: referralId.substring(0, 3), // First 3 chars
    platform: 'web',
    user_level: userContext.level,
    user_score: userContext.score,
    relationship_status: userContext.relationshipStatus,
    share_method: 'linkedin',
    ...getTimestampProperties()
  };
  
  trackMixpanel('referral_link_generated', eventProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: referral_link_generated', eventProperties);
  }
};

// Track when someone clicks a referral link
export const trackReferralVisitTracked = (referralId, visitorData = {}) => {
  const eventProperties = {
    referral_id: referralId,
    referrer_prefix: referralId.substring(0, 3), // First 3 chars  
    platform: 'web',
    visitor_referrer: visitorData.referrer || document.referrer,
    visitor_user_agent: navigator.userAgent,
    landing_page: window.location.href,
    ...getTimestampProperties()
  };
  
  trackMixpanel('referral_visit_tracked', eventProperties);
  
  // Start session recording for referred users
  startSessionRecording();
  
  // Annotate session replay
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'interaction',
    event: 'referral_visit',
    referral_id: referralId,
    referrer_prefix: referralId.substring(0, 3)
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: referral_visit_tracked', eventProperties);
    console.log('🎬 Mixpanel: Session recording started for referral visit');
  }
};

// Helper function to get consistent timestamp properties
function getTimestampProperties() {
  return {
    timestamp: new Date().toISOString(),
    unix_timestamp: Math.floor(Date.now() / 1000)
  };
}

// Navigation and State Persistence Analytics Functions

// Track when user resumes assessment from saved state
export const trackAssessmentResumed = (resumeData) => {
  const eventProperties = {
    platform: 'web',
    resume_from_screen: resumeData.fromScreen,
    resume_to_screen: resumeData.toScreen,
    time_since_last_activity: resumeData.timeSinceLastActivity || null,
    progress_percentage: resumeData.progressPercentage || 0,
    storage_source: resumeData.storageSource || 'unknown', // localStorage, sessionStorage, database
    completed_screens_count: resumeData.completedScreensCount || 0,
    ...getTimestampProperties()
  };
  
  trackMixpanel('assessment_resumed', eventProperties);
  
  // Annotate session replay
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'milestone',
    event: 'assessment_resumed',
    screen: resumeData.toScreen,
    progress: resumeData.progressPercentage
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_resumed', eventProperties);
  }
};

// Track URL-based screen access (different from existing screen tracking)
export const trackAssessmentUrlAccessed = (urlData) => {
  const eventProperties = {
    platform: 'web',
    url_path: urlData.urlPath,
    screen_name: urlData.screenName,
    access_method: urlData.accessMethod || 'direct_url', // direct_url, navigation, redirect
    is_valid_access: urlData.isValidAccess || false,
    redirect_from: urlData.redirectFrom || null,
    progress_percentage: urlData.progressPercentage || 0,
    ...getTimestampProperties()
  };
  
  trackMixpanel('assessment_url_accessed', eventProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_url_accessed', eventProperties);
  }
};

// Track when assessment data is saved to database
export const trackAssessmentSavedToDb = (saveData) => {
  const eventProperties = {
    platform: 'web',
    session_id: saveData.sessionId,
    level: saveData.level,
    relationship_status: saveData.relationshipStatus,
    completion_time_minutes: saveData.completionTimeMinutes || null,
    total_screens_completed: saveData.totalScreensCompleted || 0,
    database_save_success: saveData.success || false,
    ...getTimestampProperties()
  };
  
  trackMixpanel('assessment_saved_to_db', eventProperties);
  
  // Annotate session replay
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'milestone',
    event: 'assessment_saved_to_db',
    level: saveData.level,
    success: saveData.success
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_saved_to_db', eventProperties);
  }
};

// Track when assessment is linked to user after contact form
export const trackAssessmentLinkedToUser = (linkData) => {
  const eventProperties = {
    platform: 'web',
    session_id: linkData.sessionId,
    lead_id: linkData.leadId,
    assessment_level: linkData.level,
    relationship_status: linkData.relationshipStatus,
    time_between_completion_and_lead: linkData.timeBetweenCompletionAndLead || null,
    linking_success: linkData.success || false,
    ...getTimestampProperties()
  };
  
  trackMixpanel('assessment_linked_to_user', eventProperties);
  
  // Annotate session replay
  trackMixpanel('session_replay_annotation', {
    annotation_type: 'conversion',
    event: 'assessment_linked_to_user',
    lead_id: linkData.leadId,
    level: linkData.level
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_linked_to_user', eventProperties);
  }
};

// Track browser back/forward navigation
export const trackBrowserNavigation = (navData) => {
  const eventProperties = {
    platform: 'web',
    navigation_type: navData.type, // 'back', 'forward', 'reload'
    from_url: navData.fromUrl,
    to_url: navData.toUrl,
    from_screen: navData.fromScreen,
    to_screen: navData.toScreen,
    is_valid_transition: navData.isValidTransition || false,
    required_redirect: navData.requiredRedirect || false,
    ...getTimestampProperties()
  };
  
  trackMixpanel('browser_navigation', eventProperties);
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: browser_navigation', eventProperties);
  }
};

// Track state corruption or recovery events
export const trackStateRecovery = (recoveryData) => {
  const eventProperties = {
    platform: 'web',
    recovery_reason: recoveryData.reason, // 'corruption', 'version_mismatch', 'expired', 'missing'
    recovery_action: recoveryData.action, // 'restored_from_backup', 'reset_to_default', 'migrated'
    data_loss: recoveryData.dataLoss || false,
    recovery_source: recoveryData.source || 'unknown',
    ...getTimestampProperties()
  };
  
  trackMixpanel('assessment_state_recovery', eventProperties);
  
  // Annotate session replay for critical errors
  if (recoveryData.dataLoss) {
    trackMixpanel('session_replay_annotation', {
      annotation_type: 'error',
      event: 'state_recovery_data_loss',
      reason: recoveryData.reason
    });
  }
  
  if (import.meta.env.DEV) {
    console.log('🔍 Mixpanel: assessment_state_recovery', eventProperties);
  }
};

export default mixpanel;