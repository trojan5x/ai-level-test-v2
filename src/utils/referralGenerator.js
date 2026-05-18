/**
 * Referral ID Generation Utility
 * Generates unique referral IDs in format: First 3 letters + 5 random digits
 * Example: "JOH12345" for "John Smith"
 */

/**
 * Generate a referral ID based on user name
 * @param {string} name - User's name
 * @returns {string} Referral ID in format ABC12345
 */
export function generateReferralId(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required and must be a string');
  }
  
  // Extract first 3 letters, remove spaces, convert to uppercase
  const cleanName = name.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.substring(0, 3).toUpperCase();
  
  // If name is too short, pad with 'X'
  const paddedPrefix = prefix.padEnd(3, 'X');
  
  // Generate 5 random digits
  const suffix = Math.floor(10000 + Math.random() * 90000);
  
  return `${paddedPrefix}${suffix}`;
}

/**
 * Create a referral link with the given referral ID
 * @param {string} referralId - The referral ID
 * @param {string} baseUrl - Base URL (optional, defaults to current origin)
 * @returns {string} Complete referral link
 */
export function createReferralLink(referralId, baseUrl = null) {
  if (!referralId) {
    throw new Error('Referral ID is required');
  }
  
  // Get base URL dynamically if not provided
  const finalBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://ai-level.learntube.ai');
  
  return `${finalBaseUrl}?ref=${referralId}`;
}

/**
 * Validate referral ID format
 * @param {string} referralId - Referral ID to validate
 * @returns {boolean} True if valid format
 */
export function isValidReferralId(referralId) {
  if (!referralId || typeof referralId !== 'string') {
    return false;
  }
  
  // Check format: 3 letters + 5 digits
  const referralRegex = /^[A-Z]{3}\d{5}$/;
  return referralRegex.test(referralId);
}

/**
 * Extract referral ID from URL parameters
 * @param {string} url - URL or search params string
 * @returns {string|null} Referral ID if found, null otherwise
 */
export function extractReferralId(url = window.location.search) {
  const urlParams = new URLSearchParams(url);
  const referralId = urlParams.get('ref');
  
  return referralId && isValidReferralId(referralId) ? referralId : null;
}