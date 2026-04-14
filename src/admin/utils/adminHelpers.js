// Rate limiting and security utilities for admin dashboard

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.lockouts = new Map();
  }

  // Check if IP is currently locked out
  isLockedOut(ip) {
    const lockout = this.lockouts.get(ip);
    if (!lockout) return false;

    if (Date.now() - lockout.timestamp > LOCKOUT_DURATION) {
      this.lockouts.delete(ip);
      this.attempts.delete(ip);
      return false;
    }

    return true;
  }

  // Record a failed login attempt
  recordFailedAttempt(ip) {
    const now = Date.now();
    const attempts = this.attempts.get(ip) || [];
    
    // Remove attempts outside the rate limit window
    const recentAttempts = attempts.filter(timestamp => 
      now - timestamp < RATE_LIMIT_WINDOW
    );

    recentAttempts.push(now);
    this.attempts.set(ip, recentAttempts);

    // Check if we should lock out this IP
    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      this.lockouts.set(ip, { timestamp: now });
      console.warn(`🚨 Admin login lockout for IP: ${ip}`);
      return true; // Locked out
    }

    return false;
  }

  // Clear attempts on successful login
  clearAttempts(ip) {
    this.attempts.delete(ip);
    this.lockouts.delete(ip);
  }

  // Get remaining attempts before lockout
  getRemainingAttempts(ip) {
    if (this.isLockedOut(ip)) return 0;
    
    const attempts = this.attempts.get(ip) || [];
    const recentAttempts = attempts.filter(timestamp => 
      Date.now() - timestamp < RATE_LIMIT_WINDOW
    );

    return Math.max(0, MAX_LOGIN_ATTEMPTS - recentAttempts.length);
  }

  // Get lockout time remaining
  getLockoutTimeRemaining(ip) {
    const lockout = this.lockouts.get(ip);
    if (!lockout) return 0;

    const remaining = LOCKOUT_DURATION - (Date.now() - lockout.timestamp);
    return Math.max(0, remaining);
  }
}

// Singleton rate limiter instance
export const adminRateLimiter = new RateLimiter();

// Get client IP address (fallback for different deployment scenarios)
export const getClientIP = () => {
  // In a real deployment, you'd get this from request headers
  // For now, we'll use a combination of browser info and session storage
  let clientId = sessionStorage.getItem('admin-client-id');
  
  if (!clientId) {
    // Generate a unique client ID based on browser fingerprint
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    
    clientId = btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    sessionStorage.setItem('admin-client-id', clientId);
  }
  
  return clientId;
};

// Security headers (for deployment)
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for React
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

// Activity logger for security events
class ActivityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  log(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ip: getClientIP(),
      userAgent: navigator.userAgent,
      ...details
    };

    this.logs.unshift(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console for monitoring
    console.log(`🔐 Admin Security Event:`, logEntry);

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production' && this.shouldAlert(event)) {
      this.sendAlert(logEntry);
    }
  }

  shouldAlert(event) {
    const alertEvents = [
      'login_failed',
      'ip_locked_out',
      'suspicious_activity',
      'unauthorized_access_attempt'
    ];
    
    return alertEvents.includes(event);
  }

  async sendAlert(logEntry) {
    // In production, implement alerting (email, Slack, etc.)
    console.warn('🚨 Security Alert:', logEntry);
  }

  getRecentLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

  getLogsByEvent(event, limit = 100) {
    return this.logs
      .filter(log => log.event === event)
      .slice(0, limit);
  }

  getLogsByIP(ip, limit = 100) {
    return this.logs
      .filter(log => log.ip === ip)
      .slice(0, limit);
  }

  // Get security statistics
  getSecurityStats(timeRange = 24 * 60 * 60 * 1000) { // Last 24 hours
    const cutoff = new Date(Date.now() - timeRange);
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) > cutoff
    );

    const stats = {
      totalEvents: recentLogs.length,
      loginAttempts: recentLogs.filter(l => l.event === 'login_attempt').length,
      loginFailures: recentLogs.filter(l => l.event === 'login_failed').length,
      lockouts: recentLogs.filter(l => l.event === 'ip_locked_out').length,
      suspiciousActivity: recentLogs.filter(l => l.event === 'suspicious_activity').length,
      uniqueIPs: new Set(recentLogs.map(l => l.ip)).size
    };

    return stats;
  }
}

// Singleton activity logger
export const activityLogger = new ActivityLogger();

// Validate password strength
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const checks = [
    { valid: password.length >= minLength, message: `At least ${minLength} characters` },
    { valid: hasUppercase, message: 'Contains uppercase letter' },
    { valid: hasLowercase, message: 'Contains lowercase letter' },
    { valid: hasNumbers, message: 'Contains number' },
    { valid: hasSpecialChar, message: 'Contains special character' }
  ];

  const failedChecks = checks.filter(check => !check.valid);
  const isValid = failedChecks.length === 0;

  return {
    isValid,
    score: Math.max(0, checks.length - failedChecks.length),
    maxScore: checks.length,
    failedChecks: failedChecks.map(check => check.message)
  };
};

// Session management utilities
export const sessionUtils = {
  isSessionExpired(sessionData) {
    if (!sessionData) return true;
    
    const { timestamp } = sessionData;
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
    
    return Date.now() - timestamp > SESSION_TIMEOUT;
  },

  extendSession() {
    const sessionData = sessionStorage.getItem('ai-level-admin-session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        parsed.timestamp = Date.now();
        sessionStorage.setItem('ai-level-admin-session', JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to extend session:', error);
      }
    }
  },

  clearSession() {
    sessionStorage.removeItem('ai-level-admin-session');
    activityLogger.log('session_cleared');
  }
};

// Environment security checks
export const performSecurityChecks = () => {
  const checks = [];

  // Check if running over HTTPS in production
  if (process.env.NODE_ENV === 'production' && location.protocol !== 'https:') {
    checks.push({
      level: 'error',
      message: 'Admin dashboard must run over HTTPS in production'
    });
  }

  // Check for development warnings
  if (process.env.NODE_ENV === 'development') {
    checks.push({
      level: 'warning',
      message: 'Running in development mode - security features limited'
    });
  }

  // Check session storage availability
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
  } catch (error) {
    checks.push({
      level: 'error',
      message: 'Session storage not available - authentication will not work'
    });
  }

  return checks;
};