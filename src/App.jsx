import React, { useEffect, useState, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminDashboard from './admin/components/AdminDashboard.jsx';
import AssessmentRouter from './components/AssessmentRouter.jsx';

// Temporary redirect component for LinkedIn callback
function LinkedInCallbackRedirect() {
  useEffect(() => {
    // Redirect to assessment results with the same query parameters
    const currentParams = window.location.search;
    window.location.replace(`/assessment/results${currentParams}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-lg">Redirecting to your results...</p>
      </div>
    </div>
  );
}

import { captureLeadData, captureIntentData, trackAnalyticsEvent, scoreLLMResponse } from "./supabase.js";
import { utmTracker } from './utils/utmTracker.js';
import { startNewSession } from './utils/stateManager.js';
import { generateReferralId, createReferralLink } from './utils/referralGenerator.js';
import { generateLinkedInAuthUrl, linkedInSession, createLinkedInPostContent } from './utils/linkedinAuth.js';
import { 
  trackPageView, 
  trackAssessmentStarted, 
  trackAssessmentCompleted,
  trackLeadFormCompleted,
  trackResultPageViewed,
  trackCTAClicked,
  identifyUser,
  trackLinkedInShareInitiated,
  trackLinkedInOAuthStarted,
  trackReferralLinkGenerated
} from './mixpanel.js';

// Original header component
function Header() {
  return (
    <div className="w-full bg-gray-900/60 border-b border-gray-800/40 backdrop-blur-sm py-4 z-20 relative">
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-3 px-6 py-2">
          <img
            src="/learntube-icon.svg"
            alt="LearnTube"
            className="w-8 h-8 flex-shrink-0"
          />
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-bold tracking-wider">LearnTube.ai</span>
            <span className="text-gray-700 text-sm">|</span>
            <img src="/backed-by-google.png" alt="Backed by Google" className="h-7 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FadeIn({ children, delay = 0, direction = 'up', duration = 600, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    up: isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    down: isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0',
    left: isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
    right: isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0',
    fade: isVisible ? 'opacity-100' : 'opacity-0'
  };

  return (
    <div
      ref={ref}
      className={`transform transition-all ease-out ${directionClasses[direction]} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

function ScreenTransition({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

// Original landing page component  
function Landing() {
  const [supportsGradient, setSupportsGradient] = useState(true);

  useEffect(() => {
    // Start fresh session and capture UTM data immediately on landing
    startNewSession();
    utmTracker.initialize();
    
    // Track referral visit if referral ID is present
    const referralId = utmTracker.getReferralId();
    if (referralId) {
      utmTracker.trackReferralVisit(referralId);
    }

    // Track landing page view
    trackPageView('landing');
    
    // Test gradient text support
    const testEl = document.createElement('div');
    testEl.style.background = 'linear-gradient(to right, #fff, #ccc)';
    testEl.style.webkitBackgroundClip = 'text';
    testEl.style.backgroundClip = 'text';
    testEl.style.webkitTextFillColor = 'transparent';
    testEl.style.color = 'transparent';

    // Check if gradient is actually applied (not supported in some browsers)
    document.body.appendChild(testEl);
    const computed = getComputedStyle(testEl);

    // More robust detection
    const hasWebkitSupport = computed.webkitTextFillColor === 'transparent';
    const hasStandardSupport = computed.textFillColor === 'transparent' || computed.color === 'transparent';
    const hasBackgroundClip = computed.webkitBackgroundClip === 'text' || computed.backgroundClip === 'text';

    document.body.removeChild(testEl);

    // Only disable gradient if we're sure it's not supported (Safari iOS, Samsung Internet fallback)
    const hasGradientSupport = (hasWebkitSupport || hasStandardSupport) && hasBackgroundClip;
    setSupportsGradient(hasGradientSupport);

    // Debug log for testing
    console.log('Gradient support detected:', hasGradientSupport);
  }, []);

  const handleStart = () => {
    // Track assessment start time for completion time calculation
    window.__assessmentStartTime = Date.now();
    
    // Track assessment started
    trackAssessmentStarted();
    
    // Keep existing analytics
    trackAnalyticsEvent('test_started');
    
    // Navigate to enhanced assessment flow
    window.location.href = '/assessment/self-select';
  };

  return (
    <ScreenTransition>
      <div className="h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
        {/* Ambient glow with premium animation */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/6 rounded-full blur-3xl opacity-0 animate-[fadeInGlow_2s_ease-out_0.3s_forwards]"
        />

        {/* Logo Bar at Top - Fade in first */}
        <FadeIn delay={200} direction="fade">
          <div className="w-full bg-gray-900/60 border-b border-gray-800/40 backdrop-blur-sm py-3 z-20 relative">
            <div className="flex flex-wrap items-center gap-y-2 px-4 sm:px-8 max-w-4xl mx-auto">
              {/* LearnTube + Google — centered on mobile, left on desktop */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-start">
                <img src="/learntube-icon.svg" alt="LearnTube" className="w-7 h-7 flex-shrink-0" />
                <span className="text-white text-sm font-bold tracking-wide">LearnTube.ai</span>
                <span className="text-gray-700 text-xs mx-0.5">|</span>
                <img src="/backed-by-google.png" alt="Google for Startups" className="h-5 opacity-80" />
              </div>

              {/* In partnership with ImagiNxt — centered on mobile (row 2), right on desktop */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end sm:ml-auto">
                <span className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">In partnership with</span>
                <img src="/imaginxt-logo.avif" alt="ImagiNxt" className="h-7 opacity-85" />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          <div className="text-center max-w-md relative z-10">
            {/* User Count Pill */}
            <FadeIn delay={400} direction="up">
              <div className="inline-flex items-center bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 mb-6">
                <span className="text-blue-300 text-sm font-medium">3M+ users</span>
              </div>
            </FadeIn>

            {/* Large Split Heading with staggered animation */}
            <div className="text-6xl sm:text-7xl font-black leading-none mb-4">
              <FadeIn delay={600} direction="up">
                <div className="bg-gradient-to-br from-white via-blue-200 to-blue-600 bg-clip-text text-transparent">Find Your</div>
              </FadeIn>
              <FadeIn delay={800} direction="up">
                <div className="bg-gradient-to-br from-white via-blue-200 to-blue-600 bg-clip-text text-transparent">AI Level</div>
              </FadeIn>
            </div>

            <FadeIn delay={1200} direction="up">
              <p className="text-gray-400 text-lg sm:text-xl mb-8 leading-normal">
                How far ahead or behind are you really?<br />
                Takes under 5 minutes.
              </p>
            </FadeIn>
          </div>
        </div>

        {/* Sticky Bottom CTA Bar with sophisticated entrance */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800/40 px-6 py-4 z-30 opacity-0 translate-y-8 animate-[slideUpFromBottom_1s_ease-out_1.5s_forwards]"
        >
          <div className="max-w-sm mx-auto">
            {/* Social Proof - Delayed fade in */}
            <p
              className="text-gray-500 text-xs text-center mb-3 leading-relaxed opacity-0 animate-[fadeIn_0.6s_ease-out_2s_forwards]"
            >
              Built upon top AI proficiency standards from<br />
              <span className="text-gray-400 font-medium">BCG, Anthropic, MIT Media Lab & LearnTube</span>
            </p>

            <button
              onClick={handleStart}
              className="group w-full relative text-black font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-300 hover:translate-y-[-2px] active:translate-y-[1px] opacity-0 animate-[scaleIn_0.8s_ease-out_1.8s_forwards] overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
                boxShadow: `
                  0 8px 16px rgba(59, 130, 246, 0.3),
                  0 4px 8px rgba(59, 130, 246, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = `
                  0 12px 24px rgba(59, 130, 246, 0.4),
                  0 6px 12px rgba(59, 130, 246, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
                e.target.style.background = 'linear-gradient(145deg, #60a5fa, #2563eb)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = `
                  0 8px 16px rgba(59, 130, 246, 0.3),
                  0 4px 8px rgba(59, 130, 246, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
                e.target.style.background = 'linear-gradient(145deg, #60a5fa, #3b82f6)';
              }}
              onMouseDown={(e) => {
                e.target.style.boxShadow = `
                  0 4px 8px rgba(59, 130, 246, 0.3),
                  0 2px 4px rgba(59, 130, 246, 0.2),
                  inset 0 1px 3px rgba(0, 0, 0, 0.2),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.1)
                `;
                e.target.style.background = 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
              }}
              onMouseUp={(e) => {
                e.target.style.boxShadow = `
                  0 12px 24px rgba(59, 130, 246, 0.4),
                  0 6px 12px rgba(59, 130, 246, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
                e.target.style.background = 'linear-gradient(145deg, #60a5fa, #2563eb)';
              }}
            >
              {/* Enhanced 3D shine effect - fully contained within button boundaries */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 animate-[fadeIn_0.5s_ease-out_2.5s_forwards]"
                style={{
                  background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                  animation: 'fadeIn 0.5s ease-out 2.5s forwards, shine 4s ease-in-out infinite 3s',
                  transform: 'translateX(-100%)',
                  borderRadius: '1rem'
                }}
              />

              {/* 3D highlight on top edge */}
              <div
                className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl"
              />

              <span className="flex items-center justify-center gap-3 relative z-10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 drop-shadow-sm">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                <span className="drop-shadow-sm">Take the AI Level Test</span>
                <span className="inline-block transition-all duration-300 group-hover:translate-x-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        animation: 'slide 1.5s ease-in-out infinite 4s'
                      }}
                    />
                  </svg>
                </span>
              </span>
            </button>
            <p className="text-gray-500 text-xs text-center mt-3 opacity-0 animate-[fadeIn_0.6s_ease-out_2.5s_forwards]">
              Get instant personalised report. Free until 31st May.
            </p>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// Main App component with routing
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/assessment/*" element={<AssessmentRouter />} />
        {/* Temporary redirect for LinkedIn callback until OAuth config updates */}
        <Route path="/linkedin-callback" element={<LinkedInCallbackRedirect />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}