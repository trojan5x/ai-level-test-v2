/**
 * Assessment Redirect Component  
 * Intelligently redirects users to the appropriate assessment screen
 * based on their current progress and state
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canAccessScreen, isAssessmentComplete } from '../utils/stateManager.js';

const AssessmentRedirect = ({ assessmentState, context }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!assessmentState) return;

    const determineTargetScreen = () => {
      // If user has completed the full assessment
      if (isAssessmentComplete(assessmentState)) {
        // If they have lead data, go to results
        if (assessmentState.user.leadData) {
          return '/assessment/results';
        }
        // If results are calculated but no lead data, go to contact form
        if (assessmentState.results.level !== null) {
          return '/assessment/contact';
        }
        // If assessment complete but no results calculated, go to processing
        return '/assessment/processing';
      }

      // Find the next incomplete screen
      const screenOrder = [
        'item1', 'item1/results',
        'item2', 'item2/results', 
        'item3', 'item3/results',
        'item4', 'item4/results',
        'item5a', 'item5a/results',
        'item5b', 'item5b/results',
        'item6'
      ];

      // Check last completed screen and determine next step
      const completedScreens = assessmentState.navigation.completedScreens;
      
      // If no screens completed, start with item1 (skip landing for now)
      if (completedScreens.length === 0 || completedScreens.includes('landing')) {
        return '/assessment/item1';
      }
      
      for (const screen of screenOrder) {
        const screenName = screen.replace('/', '_').replace('_results', '_reveal');
        
        if (!completedScreens.includes(screenName)) {
          return `/assessment/${screen}`;
        }
      }

      // If all screens completed but no processing done yet
      return '/assessment/processing';
    };

    const targetUrl = determineTargetScreen();
    console.log('🔄 Redirecting to:', targetUrl);
    
    // Use replace to avoid adding to history stack
    navigate(targetUrl, { replace: true });
  }, [assessmentState, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p>Finding where you left off...</p>
      </div>
    </div>
  );
};

export default AssessmentRedirect;