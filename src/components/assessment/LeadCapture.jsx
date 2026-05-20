/**
 * LeadCapture Component - Contact information form
 * Extracted from App.jsx for new navigation system
 */

import React, { useState, useEffect } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import Header from '../Header.jsx';
import { trackAnalyticsEvent } from '../../supabase.js';
import { updateAssessmentWithContact, getSessionId } from '../../utils/stateManager.js';
import { trackLeadFormCompleted, identifyUser } from '../../mixpanel.js';
import { generateReferralId } from '../../utils/referralGenerator.js';
import { utmTracker } from '../../utils/utmTracker.js';
import { EnhancedScoring, mergeAssessmentScores, getAssessmentPrimaryTotal } from '../../utils/stateManager.js';
import { generateAIReportPDF, dispatchPDFReportToWhatsApp } from '../../utils/pdfGenerator.js';

// Country codes for international phone number input support
const COUNTRY_CODES = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+62", country: "ID", flag: "🇮🇩" },
  { code: "+60", country: "MY", flag: "🇲🇾" },
  { code: "+63", country: "PH", flag: "🇵🇭" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+974", country: "QA", flag: "🇶🇦" },
  { code: "+852", country: "HK", flag: "🇭🇰" },
];

// Level data - simplified version
const LEVEL_DATA = {
  0: { color: "#64748b", name: "Non-User" },
  1: { color: "#8b5cf6", name: "Skeptical" }, 
  2: { color: "#06b6d4", name: "Curious" },
  3: { color: "#10b981", name: "Fluent" },
  4: { color: "#f59e0b", name: "Power User" }
};

function LeadCapture({ assessmentContext }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [stage, setStage] = useState(0);
  
  // Calculate level from scores using accurate algorithms
  const { state } = assessmentContext;
  const responses = state.assessment.responses || {};
  const path = state.navigation?.assessmentPath || "B";
  
  // Merge core and enhanced scores for accurate telemetry and level computation
  const mergedScores = mergeAssessmentScores(state.assessment);
  
  const level = state.results?.level !== null && state.results?.level !== undefined 
    ? state.results.level 
    : EnhancedScoring.computeLevel(mergedScores, path, responses);
    
  const relationshipStatus = state.results?.relationshipStatus 
    ? state.results.relationshipStatus 
    : EnhancedScoring.computeRelationshipStatus(mergedScores, level, responses);
  
  const data = LEVEL_DATA[level] || LEVEL_DATA[4];

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isIndianNumber = countryCode === "+91";
  const phoneDigits = phone.trim();
  const isPhoneValid = isIndianNumber
    ? phoneDigits.length === 10
    : phoneDigits.length >= 7;
  const canSubmit = name.trim().length >= 2 && isPhoneValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const totalScore = getAssessmentPrimaryTotal(mergedScores);
    const referredBy = utmTracker.getReferralId();
    const newReferralId = generateReferralId(name.trim());

    const leadData = {
      name: name.trim(),
      phone: `${countryCode}${phone.trim()}`,
      email: email.trim() || null,
      level,
      relationshipStatus,
      scores: mergedScores,
      referralId: newReferralId,
      referredBy: referredBy,
      timestamp: Date.now()
    };

    // Track Mixpanel lead form completion (VALUE MOMENT)
    trackLeadFormCompleted(
      { name: leadData.name, email: leadData.email, phone: leadData.phone },
      { score: totalScore, level: level },
      {
        form_completion_time: Date.now() - (window.__assessmentStartTime || Date.now())
      }
    );

    // Identify user in Mixpanel
    identifyUser(
      { name: leadData.name, email: leadData.email || leadData.phone, phone: leadData.phone },
      { score: totalScore, level: level }
    );

    // Track lead capture event
    trackAnalyticsEvent('lead_captured', { level, name: name.trim() });

    // Update the session's assessment record with contact details
    const sessionId = getSessionId();
    const result = await updateAssessmentWithContact(sessionId, {
      name:  leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      referralId: leadData.referralId,
      referredBy: leadData.referredBy
    });

    if (result.success && result.data) {
      leadData.id = result.data.id;
    }

    // Generate full detailed report PDF on the frontend & dispatch via fire-and-forget API
    try {
      console.log("📄 Generating premium PDF Report on frontend...");
      const pdfBlob = await generateAIReportPDF(leadData);
      dispatchPDFReportToWhatsApp(leadData.phone, pdfBlob, leadData);
    } catch (pdfError) {
      console.error("⚠️ Failed to generate or dispatch PDF report:", pdfError);
    }

    // Store lead data globally
    window.__aiLevelLead = leadData;

    // Update state and navigate to results
    const updatedState = {
      ...state,
      user: {
        ...state.user,
        leadData
      },
      navigation: {
        ...state.navigation,
        completedScreens: [...new Set([...state.navigation.completedScreens, 'capture'])]
      }
    };
    
    console.log('💾 Saving leadData to state:', leadData);
    console.log('📊 Updated state for navigation:', updatedState.user.leadData);
    
    // Save state and navigate
    assessmentContext.setState(updatedState);
    
    // Wait longer for state to update, then navigate
    setTimeout(() => {
      console.log('🔄 Now navigating to reveal screen');
      assessmentContext.updateUrl('reveal');
    }, 200);
  };

  // Simplified locked cards
  const lockedCards = [
    {
      icon: "🌀",
      label: "Your AI Relationship",
      tease: "You're ████ with AI",
      accentColor: "#a78bfa",
    },
    {
      icon: "⚡",
      label: "3 ways to level up",
      tease: "Your #1 gap: ████████",
      accentColor: "#34d399",
    },
    {
      icon: "🔍",
      label: "Strengths & blind spots", 
      tease: "You're strong at ████ but ████",
      accentColor: "#60a5fa",
    },
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-start pt-12 pb-8 px-5 overflow-auto relative">
          {/* Level-colored background glow */}
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[100px] opacity-[0.07] pointer-events-none"
            style={{ backgroundColor: data.color }}
          />

          <div className="max-w-sm w-full relative z-10">
          {/* Level number — blurred until form submit */}
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-gray-500 text-[10px] font-semibold tracking-[0.25em] uppercase mb-1">Your level is ready</p>
            <div className="relative inline-flex items-center justify-center min-w-[4rem] min-h-[3rem]">
              <div
                className="text-4xl sm:text-5xl font-extrabold leading-none blur-md select-none pointer-events-none opacity-70"
                style={{ color: data.color }}
                aria-hidden="true"
              >
                {level >= 5 ? "5+" : level}
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute text-gray-500"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-gray-600 text-[10px] mt-1">Unlock below to reveal</p>
          </div>

          {/* Locked preview cards */}
          <div className={`transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
              {lockedCards.map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-800/40 px-3.5 py-2.5 flex items-center gap-3"
                >
                  <span className="text-base flex-shrink-0">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[11px] font-medium leading-tight">{card.label}</p>
                    <p className="text-[11px] mt-0.5 leading-tight" style={{ color: card.accentColor, filter: "blur(4px)", userSelect: "none" }}>
                      {card.tease}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 flex-shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className={`transition-all duration-700 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <FadeIn delay={900} direction="up">
              <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/40 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-500">
                <p className="text-white text-sm font-semibold text-center mb-0.5">Unlock your full AI profile</p>
                <p className="text-gray-500 text-[11px] text-center mb-3">Sent to your WhatsApp — instantly.</p>

                <div className="space-y-2 mb-3">
                  <FadeIn delay={1100} direction="up">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoCapitalize="words"
                      autoFocus
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500 hover:bg-gray-800/80 mp-sensitive"
                    />
                  </FadeIn>
                  <FadeIn delay={1200} direction="up">
                    <div className="flex items-center gap-0 bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all hover:bg-gray-800/80">
                      <div className="relative flex items-center">
                        <select
                          value={countryCode}
                          onChange={(e) => {
                            const newCode = e.target.value;
                            setCountryCode(newCode);
                            if (newCode === "+91") {
                              setPhone((prev) => prev.slice(0, 10));
                            }
                          }}
                          className="bg-transparent text-gray-300 text-sm pl-4 pr-7 py-2.5 focus:outline-none appearance-none cursor-pointer mp-sensitive border-r border-gray-700/50"
                          style={{ minWidth: "85px" }}
                        >
                          {COUNTRY_CODES.map(cc => (
                            <option key={`${cc.country}-${cc.code}`} value={cc.code} className="bg-gray-900 text-white text-sm">
                              {cc.flag} {cc.code}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-2.5 pointer-events-none text-gray-500 text-[10px]">▼</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const maxLen = countryCode === "+91" ? 10 : 15;
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, maxLen));
                        }}
                        placeholder="WhatsApp number"
                        className="flex-1 bg-transparent py-2.5 px-4 text-white text-sm focus:outline-none placeholder-gray-500 mp-sensitive"
                      />
                    </div>
                  </FadeIn>
                  
                  {!showEmail && (
                    <button
                      onClick={() => setShowEmail(true)}
                      className="w-full text-blue-400 text-xs hover:text-blue-300 transition-colors py-1"
                    >
                      + Add email (optional)
                    </button>
                  )}
                  
                  {showEmail && (
                    <FadeIn direction="up">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500 hover:bg-gray-800/80 mp-sensitive"
                      />
                    </FadeIn>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`w-full font-semibold py-3 rounded-xl text-sm transition-all duration-300 ${canSubmit
                      ? "bg-white text-gray-950 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  Get My Full Results →
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default LeadCapture;