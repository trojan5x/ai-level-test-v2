import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth.js';
import { adminRateLimiter, getClientIP, activityLogger } from '../utils/adminHelpers.js';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientIP, setClientIP] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [lockoutTime, setLockoutTime] = useState(0);
  const { login, loginError, isLoading } = useAdminAuth();

  useEffect(() => {
    const ip = getClientIP();
    setClientIP(ip);
    
    // Check initial rate limit status
    updateRateLimitStatus(ip);
    
    // Log access attempt
    activityLogger.log('admin_page_accessed', { ip });
  }, []);

  useEffect(() => {
    let interval;
    if (lockoutTime > 0) {
      interval = setInterval(() => {
        const remaining = adminRateLimiter.getLockoutTimeRemaining(clientIP);
        setLockoutTime(remaining);
        
        if (remaining === 0) {
          updateRateLimitStatus(clientIP);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [lockoutTime, clientIP]);

  const updateRateLimitStatus = (ip) => {
    setRemainingAttempts(adminRateLimiter.getRemainingAttempts(ip));
    setLockoutTime(adminRateLimiter.getLockoutTimeRemaining(ip));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    const ip = getClientIP();

    // Check if IP is locked out
    if (adminRateLimiter.isLockedOut(ip)) {
      activityLogger.log('login_blocked_lockout', { ip, password_length: password.length });
      setPassword('');
      return;
    }

    // Log login attempt
    activityLogger.log('login_attempt', { ip, timestamp: Date.now() });

    const success = await login(password);
    
    if (success) {
      // Clear rate limiting on successful login
      adminRateLimiter.clearAttempts(ip);
      activityLogger.log('login_success', { ip });
    } else {
      // Record failed attempt
      const isNowLockedOut = adminRateLimiter.recordFailedAttempt(ip);
      
      activityLogger.log('login_failed', { 
        ip, 
        password_length: password.length,
        locked_out: isNowLockedOut 
      });

      if (isNowLockedOut) {
        activityLogger.log('ip_locked_out', { ip });
      }

      updateRateLimitStatus(ip);
      setPassword(''); // Clear password on failed login
    }
  };

  const isLockedOut = lockoutTime > 0;
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="/learntube-icon.svg" 
              alt="LearnTube" 
              className="w-8 h-8"
            />
            <span className="text-white text-lg font-bold tracking-wider">LEARNTUBE</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Enter your password to access the analytics dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 pr-12"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {loginError}
                {!isLockedOut && remainingAttempts < 5 && (
                  <div className="mt-2 text-xs text-red-300">
                    {remainingAttempts} attempts remaining before lockout
                  </div>
                )}
              </div>
            )}

            {isLockedOut && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Account temporarily locked
                </div>
                <div className="text-xs text-amber-300">
                  Too many failed attempts. Try again in {formatTime(lockoutTime)}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim() || isLockedOut}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isLoading || !password.trim() || isLockedOut
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-400 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : isLockedOut ? (
                `Locked out - ${formatTime(lockoutTime)}`
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-4 border-t border-gray-800/40">
            <p className="text-gray-500 text-xs text-center">
              🔒 Secure admin access • Session expires after 24 hours
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;