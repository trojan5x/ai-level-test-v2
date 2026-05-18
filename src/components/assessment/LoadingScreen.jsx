/**
 * LoadingScreen Component - Processing results screen
 * Extracted from App.jsx for new navigation system
 */

import React, { useState, useEffect } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import { trackAssessmentCompleted } from '../../mixpanel.js';
import { EnhancedScoring, mergeAssessmentScores, getAssessmentPrimaryTotal, saveAssessmentToDatabase } from '../../utils/stateManager.js';

function LoadingScreen({ assessmentContext }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0); // 0=analyzing, 1=teaser, 2=done
  const { state } = assessmentContext;

  const labels = [
    "Reading your patterns",
    "Scoring your judgment", 
    "Detecting your AI relationship",
    "Building your profile",
  ];

  useEffect(() => {
    // Track assessment completed when LoadingScreen mounts
    const mergedScores = mergeAssessmentScores(state.assessment);
    const totalScore = getAssessmentPrimaryTotal(mergedScores);

    const path = state.navigation?.assessmentPath || "B";
    const responses = state.assessment.responses || {};
    const level = EnhancedScoring.computeLevel(mergedScores, path, responses);
    const relationshipStatus = EnhancedScoring.computeRelationshipStatus(mergedScores, level, responses);
    
    trackAssessmentCompleted(totalScore, level, level, {
      completion_time: Date.now() - (window.__assessmentStartTime || Date.now()),
      questions_answered: Object.keys(state.assessment.scores || {}).length
    });

    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => setStep(3), 2300);
    const t4 = setTimeout(() => setPhase(1), 3200);
    const t5 = setTimeout(() => {
      console.log('🔄 LoadingScreen: Animation complete, computing final results');
      
      const mergedScores = mergeAssessmentScores(state.assessment);
      const totalScore = getAssessmentPrimaryTotal(mergedScores);

      const path = state.navigation?.assessmentPath || "B";
      const responses = state.assessment.responses || {};
      const level = EnhancedScoring.computeLevel(mergedScores, path, responses);
      const relationshipStatus = EnhancedScoring.computeRelationshipStatus(mergedScores, level, responses);
      
      console.log('📊 Computed results - Score:', totalScore, 'Level:', level, 'Relationship:', relationshipStatus);
      
      // Update state with computed results before navigation
      const updatedState = {
        ...state,
        results: {
          ...state.results,
          level: level,
          relationshipStatus: relationshipStatus,
          score: totalScore,
          timestamp: Date.now()
        },
        navigation: {
          ...state.navigation,
          completedScreens: [...new Set([...state.navigation.completedScreens, 'loading'])]
        }
      };
      
      console.log('💾 Saving updated state with results:', updatedState.results);
      
      // Save the updated state locally
      assessmentContext.setState(updatedState);

      // Persist to database — fire-and-forget, does not block navigation
      saveAssessmentToDatabase(updatedState);
      
      // Wait a moment for state to update, then navigate
      setTimeout(() => {
        console.log('🔄 Now navigating to capture');
        assessmentContext.updateUrl('capture');
      }, 100);
    }, 4500);
    
    return () => { 
      clearTimeout(t1); 
      clearTimeout(t2); 
      clearTimeout(t3); 
      clearTimeout(t4); 
      clearTimeout(t5); 
    };
  }, [state, assessmentContext]);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Animated background glow with multiple layers */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-out ${phase >= 1 ? "bg-blue-500/8 scale-200 blur-3xl" : "bg-blue-500/4 scale-100 blur-2xl"
            }`} />
          <div className={`absolute w-64 h-64 rounded-full transition-all duration-[2500ms] ease-out delay-300 ${phase >= 1 ? "bg-emerald-500/6 scale-150 blur-2xl" : "bg-emerald-500/3 scale-90 blur-xl"
            }`} />
          <div className={`absolute w-32 h-32 rounded-full transition-all duration-[2000ms] ease-out delay-500 ${phase >= 1 ? "bg-white/4 scale-125 blur-xl" : "bg-white/2 scale-80 blur-lg"
            }`} />
        </div>

        {/* Particle effect overlay */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse-smooth`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i * 0.3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className={`transition-all duration-1000 ease-out ${phase === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 scale-95"
            }`}>
            {labels.map((label, i) => (
              <FadeIn key={i} delay={i * 300 + 200} direction="up">
                <div
                  className={`transition-all duration-700 ease-out mb-6 ${i <= step ? "opacity-100 translate-y-0 scale-100" : "opacity-30 translate-y-2 scale-95"
                    }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-lg transition-all duration-500 ${i < step ? "text-blue-400 scale-110" : i === step ? "text-emerald-400 animate-pulse-smooth" : "text-gray-500"
                      }`}>
                      {i < step ? "✓" : i === step ? "◆" : "◦"}
                    </span>
                    <span className={`text-sm font-medium transition-all duration-500 ${i < step ? "text-blue-300" : i === step ? "text-white" : "text-gray-400"
                      }`}>
                      {label}
                    </span>
                  </div>
                  {i < step && (
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mx-auto mt-2 animate-[fadeIn_0.5s_ease-out]" />
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-out ${phase >= 1 ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"
            }`}>
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full mx-auto animate-spin" />
              </div>
              <p className="text-emerald-400 text-lg font-medium animate-pulse-smooth">Your results are ready.</p>
              <p className="text-gray-500 text-sm mt-2">Preparing your personalized insights...</p>
            </div>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default LoadingScreen;