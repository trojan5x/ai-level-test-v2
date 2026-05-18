/**
 * LinkedIn OAuth Authentication Utilities
 * Handles LinkedIn OAuth flow for social sharing integration
 */

// LinkedIn OAuth Configuration
const LINKEDIN_CLIENT_ID = '86h7ayn66hgjuf';
const LINKEDIN_SCOPES = 'w_member_social profile openid email r_basicprofile';

/**
 * Get the appropriate redirect URI based on environment
 * @returns {string} Redirect URI for LinkedIn OAuth
 * 
 * Note: Currently returns /assessment/results for the modal integration.
 * However, LinkedIn's OAuth config may still have the old /linkedin-callback
 * cached, so we have a temporary redirect in App.jsx to handle this.
 */
export function getLinkedInRedirectUri() {
  // Get base URL dynamically from current window location
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  // Redirect to result page instead of separate callback route
  return `${baseUrl}/assessment/results`;
}

/**
 * Generate LinkedIn OAuth URL
 * @param {string} state - State parameter for CSRF protection (usually referral ID)
 * @returns {string} Complete LinkedIn OAuth URL
 */
export function generateLinkedInAuthUrl(state) {
  const redirectUri = getLinkedInRedirectUri();
  const params = new URLSearchParams({
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: LINKEDIN_SCOPES,
    state: state || generateRandomState()
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Generate a random state parameter for CSRF protection
 * @returns {string} Random state string
 */
function generateRandomState() {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Parse OAuth callback parameters from URL
 * @param {string} url - URL string or search params (defaults to current location)
 * @returns {Object} Parsed OAuth parameters
 */
export function parseOAuthCallback(url = window.location.search) {
  const urlParams = new URLSearchParams(url);
  
  return {
    code: urlParams.get('code'),
    state: urlParams.get('state'),
    error: urlParams.get('error'),
    error_description: urlParams.get('error_description')
  };
}

/**
 * Validate OAuth callback response
 * @param {Object} callbackData - Parsed OAuth callback data
 * @returns {Object} Validation result with success status and details
 */
export function validateOAuthCallback(callbackData) {
  const { code, state, error, error_description } = callbackData;

  // Check for OAuth errors
  if (error) {
    return {
      success: false,
      error: error,
      message: error_description || getErrorMessage(error),
      shouldRetry: error !== 'access_denied' // Don't retry if user denied access
    };
  }

  // Check for required parameters
  if (!code) {
    return {
      success: false,
      error: 'missing_code',
      message: 'Authorization code not received from LinkedIn',
      shouldRetry: false
    };
  }

  if (!state) {
    return {
      success: false,
      error: 'missing_state',
      message: 'State parameter missing - possible CSRF attack',
      shouldRetry: false
    };
  }

  return {
    success: true,
    code,
    state
  };
}

/**
 * Get user-friendly error message for OAuth errors
 * @param {string} error - OAuth error code
 * @returns {string} User-friendly error message
 */
function getErrorMessage(error) {
  const errorMessages = {
    'access_denied': 'You cancelled the LinkedIn authorization. Please try again to share your badge.',
    'invalid_request': 'There was a problem with the LinkedIn authorization request.',
    'unauthorized_client': 'Our app is not authorized to request LinkedIn access.',
    'unsupported_response_type': 'LinkedIn authorization configuration error.',
    'invalid_scope': 'Requested LinkedIn permissions are not available.',
    'server_error': 'LinkedIn is experiencing technical difficulties. Please try again.',
    'temporarily_unavailable': 'LinkedIn is temporarily unavailable. Please try again in a few minutes.'
  };

  return errorMessages[error] || 'An unexpected error occurred during LinkedIn authorization.';
}

/**
 * Create LinkedIn post content from user data
 * @param {Object} userData - User assessment data
 * @param {string} referralLink - Personalized referral link
 * @returns {string} Formatted LinkedIn post text
 */
export function createLinkedInPostContent(userData, referralLink) {
  const { level, levelData, relationshipData, percentile } = userData;

  // Generate insights summary (shortened for LinkedIn)
  let insightsSummary = '';
  if (levelData.insights && levelData.insights.length > 0) {
    insightsSummary = levelData.insights[0]; // Use the first insight
    // Limit to 100 characters for readability
    if (insightsSummary.length > 100) {
      insightsSummary = insightsSummary.substring(0, 97) + '...';
    }
  }

  const postContent = `🚀 Just discovered my AI relationship level!

I'm AI Level ${level >= 5 ? '5+' : level} — ${levelData.name} ${relationshipData.emoji}
My AI Relationship Status: ${relationshipData.status}

${insightsSummary ? insightsSummary + '\n\n' : ''}Top ${percentile}% of test-takers! 🎯

Want to find out yours? Take the assessment ⬇️
${referralLink}

#AIAssessment #ArtificialIntelligence #TechSkills #LearnTubeAI #PersonalDevelopment #AILevel`;

  return postContent;
}

/**
 * Prepare data for LinkedIn sharing API call
 * @param {Object} params - Sharing parameters
 * @returns {Object} API payload
 */
export function prepareLinkedInApiPayload(params) {
  const { 
    authorizationCode, 
    userInfo, 
    badgeImageBase64, 
    postText,
    redirectUri,
    level,
    relationshipStatus,
    referralId
  } = params;

  return {
    code: authorizationCode,
    redirect_uri: redirectUri || getLinkedInRedirectUri(),
    post_comment: postText,
    source: 'ai-levels',
    extra_details: {
      user_name: userInfo.name,
      user_email: userInfo.email,
      level: level,
      relationship_status: relationshipStatus,
      referral_id: referralId
    },
    image_file: badgeImageBase64 // This will be converted to a File object in the API call
  };
}

/**
 * Handle LinkedIn sharing session storage
 */
export const linkedInSession = {
  /**
   * Store sharing data for OAuth callback
   * @param {Object} sharingData - Data to store
   */
  store(sharingData) {
    const sessionData = {
      ...sharingData,
      timestamp: Date.now(),
      expires: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    sessionStorage.setItem('linkedin_share_data', JSON.stringify(sessionData));
  },

  /**
   * Retrieve sharing data from session storage
   * @returns {Object|null} Stored sharing data or null if expired/missing
   */
  retrieve() {
    try {
      const stored = sessionStorage.getItem('linkedin_share_data');
      if (!stored) return null;

      const sessionData = JSON.parse(stored);
      
      // Check if data has expired
      if (Date.now() > sessionData.expires) {
        this.clear();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Error retrieving LinkedIn session data:', error);
      this.clear();
      return null;
    }
  },

  /**
   * Clear sharing data from session storage
   */
  clear() {
    sessionStorage.removeItem('linkedin_share_data');
  }
};

export default {
  getLinkedInRedirectUri,
  generateLinkedInAuthUrl,
  parseOAuthCallback,
  validateOAuthCallback,
  createLinkedInPostContent,
  prepareLinkedInApiPayload,
  linkedInSession
};