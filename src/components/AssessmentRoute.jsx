/**
 * Assessment Route Guard Component
 * Validates user access to specific assessment screens based on progress
 * Handles redirects for invalid access attempts
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { canAccessScreen, saveAssessmentState } from '../utils/stateManager.js';
import { shouldTrackAnalytics } from '../utils/analyticsEnvironment.js';

const AssessmentRoute = React.memo(({ screen, context, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const { state: assessmentState, setState, updateUrl } = context;

  // Memoize validation to prevent unnecessary re-runs
  const accessValidation = useMemo(() => {
    if (!assessmentState) return { canAccess: false, shouldRedirect: false };
    
    const canAccess = canAccessScreen(screen, assessmentState);
    return { canAccess, shouldRedirect: !canAccess };
  }, [screen, assessmentState?.navigation?.completedScreens, assessmentState?.assessment?.responses]);

  useEffect(() => {
    if (!assessmentState) return;

    const { canAccess, shouldRedirect } = accessValidation;
    
    if (shouldRedirect) {
      console.warn('🚫 Access denied to screen:', screen);
      const redirectTarget = determineValidRedirect();
      console.log('🔄 Redirecting to valid screen:', redirectTarget);
      navigate(redirectTarget, { replace: true });
      return;
    }

    // Access granted - only update if not already granted
    if (!hasAccess || isValidating) {
      setHasAccess(true);
      setIsValidating(false);
      updateDocumentTitle(screen);
      trackScreenAccess(screen);
      console.log('✅ Access granted to screen:', screen);
    }
  }, [screen, assessmentState, accessValidation, hasAccess, isValidating, navigate]);

  /**
   * Determine where to redirect user when access is denied
   */
  const determineValidRedirect = () => {
    if (!assessmentState) return '/';

    const completedScreens = assessmentState.navigation.completedScreens;
    
    // If trying to access results screens without completing the item
    if (screen.includes('_reveal')) {
      const itemName = screen.replace('_reveal', '');
      if (!completedScreens.includes(itemName)) {
        return `/assessment/${itemName}`;
      }
    }
    
    // Enhanced assessment flow order
    const enhancedScreenOrder = [
      'selfSelect', 'context', 'behavioralFreq', 'aiDiet',
      'item1', 'item1_reveal', 'item2', 'item2_reveal',
      'item3', 'item3_reveal', 'item3b', 'item3b_reveal',
      'item4', 'item4_reveal', 'item5a', 'item5a_reveal',
      'item5b', 'item5b_reveal', 'item6',
      'workflowDesign', 'workflowDesign_reveal',
      'systemBuilder', 'systemBuilder_reveal',
      'loading', 'capture', 'reveal'
    ];

    const currentIndex = enhancedScreenOrder.indexOf(screen);
    
    // Find the last accessible screen
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevScreen = enhancedScreenOrder[i];
      if (canAccessScreen(prevScreen, assessmentState)) {
        const enhancedUrlMap = {
          'selfSelect': '/assessment/self-select',
          'context': '/assessment/context',
          'behavioralFreq': '/assessment/behavioral',
          'aiDiet': '/assessment/ai-diet',
          'item1': '/assessment/item1',
          'item1_reveal': '/assessment/item1/results',
          'item2': '/assessment/item2',
          'item2_reveal': '/assessment/item2/results',
          'item3': '/assessment/item3', 
          'item3_reveal': '/assessment/item3/results',
          'item3b': '/assessment/item3b',
          'item3b_reveal': '/assessment/item3b/results',
          'item4': '/assessment/item4',
          'item4_reveal': '/assessment/item4/results',
          'item5a': '/assessment/item5a',
          'item5a_reveal': '/assessment/item5a/results',
          'item5b': '/assessment/item5b',
          'item5b_reveal': '/assessment/item5b/results',
          'item6': '/assessment/item6',
          'workflowDesign': '/assessment/workflow-design',
          'workflowDesign_reveal': '/assessment/workflow-design/results',
          'systemBuilder': '/assessment/system-builder',
          'systemBuilder_reveal': '/assessment/system-builder/results',
          'loading': '/assessment/processing',
          'capture': '/assessment/contact',
          'reveal': '/assessment/results'
        };
        return enhancedUrlMap[prevScreen] || '/assessment/self-select';
      }
    }
    
    // Default fallback - start with enhanced flow
    return '/assessment/self-select';
  };

  /**
   * Update document title based on current screen
   */
  const updateDocumentTitle = (screenName) => {
    const titleMap = {
      'selfSelect': 'AI Assessment - Self Assessment',
      'context': 'AI Assessment - Background',
      'behavioralFreq': 'AI Assessment - Usage Patterns', 
      'aiDiet': 'AI Assessment - Tool Experience',
      'item1': 'AI Assessment - Question 1',
      'item1_reveal': 'AI Assessment - Question 1 Results',
      'item2': 'AI Assessment - Question 2',
      'item2_reveal': 'AI Assessment - Question 2 Results',
      'item3': 'AI Assessment - Question 3',
      'item3_reveal': 'AI Assessment - Question 3 Results',
      'item3b': 'AI Assessment - Question 3B',
      'item3b_reveal': 'AI Assessment - Question 3B Results',
      'item4': 'AI Assessment - Question 4', 
      'item4_reveal': 'AI Assessment - Question 4 Results',
      'item5a': 'AI Assessment - Question 5A',
      'item5a_reveal': 'AI Assessment - Question 5A Results',
      'item5b': 'AI Assessment - Question 5B',
      'item5b_reveal': 'AI Assessment - Question 5B Results',
      'item6': 'AI Assessment - Question 6',
      'workflowDesign': 'AI Assessment - Workflow Design',
      'workflowDesign_reveal': 'AI Assessment - Workflow Results',
      'systemBuilder': 'AI Assessment - System Builder',
      'systemBuilder_reveal': 'AI Assessment - System Results',
      'loading': 'AI Assessment - Processing Results',
      'capture': 'AI Assessment - Contact Information',
      'reveal': 'AI Assessment - Your Results'
    };
    
    document.title = titleMap[screenName] || 'AI Level Assessment';
  };

  /**
   * Track screen access for analytics - optimized to prevent loops
   */
  const trackScreenAccess = (screenName) => {
    if (shouldTrackAnalytics() && window.mixpanel && typeof window.mixpanel.track === 'function') {
      window.mixpanel.track('assessment_screen_accessed', {
        screen: screenName,
        url: location.pathname,
        timestamp: new Date().toISOString()
      });
    }

    // Only update state if the current screen is different
    if (assessmentState.navigation.currentScreen !== screenName) {
      const updatedState = {
        ...assessmentState,
        navigation: {
          ...assessmentState.navigation,
          currentScreen: screenName,
          lastActiveUrl: location.pathname
        },
        analytics: {
          ...assessmentState.analytics,
          firedEvents: [...(assessmentState.analytics?.firedEvents || []), `screen_accessed_${screenName}`]
        }
      };
      
      setState(updatedState);
      saveAssessmentState(updatedState);
    }
  };

  // Show validation loading screen
  if (isValidating || !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Validating access...</p>
        </div>
      </div>
    );
  }

  // Render the protected component with enhanced props
  return React.cloneElement(children, {
    ...children.props,
    assessmentState,
    assessmentContext: context,
    screenName: screen,
    onProgress: (newState) => {
      setState(newState);
      saveAssessmentState(newState);
    },
    onNavigate: (targetScreen) => {
      updateUrl(targetScreen);
    }
  });
});

export default AssessmentRoute;