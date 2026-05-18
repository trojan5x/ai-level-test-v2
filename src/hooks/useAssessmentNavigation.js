/**
 * Assessment Navigation Hook - Enhanced for Adaptive Assessment
 * Provides navigation utilities and state management for assessment screens
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  loadAssessmentState, 
  saveAssessmentState, 
  canAccessScreen,
  isAssessmentComplete,
  getAssessmentProgress,
  saveAssessmentToDatabase,
  linkAssessmentToUser,
  ScoreSnapshots,
  PathLogic,
  EnhancedScoring
} from '../utils/stateManager.js';

/**
 * Custom hook for assessment navigation and state management
 */
export const useAssessmentNavigation = () => {
  const [assessmentState, setAssessmentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize assessment state on mount
  useEffect(() => {
    const initializeAssessment = async () => {
      try {
        setLoading(true);
        const state = await loadAssessmentState();
        setAssessmentState(state);
        console.log('🎯 Assessment navigation initialized');
      } catch (err) {
        console.error('❌ Failed to initialize assessment navigation:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAssessment();
  }, []);

  /**
   * Navigate to a specific screen with state validation and snapshots
   */
  const navigateToScreen = useCallback((screenName, options = {}) => {
    if (!assessmentState) return false;

    // Take snapshot before navigation (unless disabled)
    if (!options.skipSnapshot) {
      const snapshot = ScoreSnapshots.takeSnapshot(assessmentState);
      const stateWithSnapshot = ScoreSnapshots.saveSnapshot(assessmentState, snapshot);
      setAssessmentState(stateWithSnapshot);
      saveAssessmentState(stateWithSnapshot);
    }

    // Check if navigation is allowed
    if (!canAccessScreen(screenName, assessmentState) && !options.force) {
      console.warn('🚫 Navigation blocked to:', screenName);
      return false;
    }

    // Enhanced screen to URL mapping with new assessment components
    const screenToUrl = {
      'landing': '/',
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

    const targetUrl = screenToUrl[screenName];
    if (!targetUrl) {
      console.error('❌ Unknown screen name:', screenName);
      return false;
    }

    // Navigate to the URL
    if (options.replace) {
      navigate(targetUrl, { replace: true });
    } else {
      navigate(targetUrl);
    }

    console.log('🔄 Navigated to:', screenName, targetUrl);
    return true;
  }, [assessmentState, navigate]);

  /**
   * Mark a screen as completed and update state
   */
  const markScreenCompleted = useCallback(async (screenName, additionalData = {}) => {
    if (!assessmentState) return false;

    try {
      const updatedState = {
        ...assessmentState,
        navigation: {
          ...assessmentState.navigation,
          completedScreens: [...new Set([...assessmentState.navigation.completedScreens, screenName])],
          currentScreen: screenName
        },
        ...additionalData
      };

      // Save state locally
      setAssessmentState(updatedState);
      saveAssessmentState(updatedState);

      // If assessment is now complete, save to database
      if (isAssessmentComplete(updatedState) && updatedState.results.level !== null) {
        console.log('🎯 Assessment completed, saving to database');
        const dbResult = await saveAssessmentToDatabase(updatedState);
        
        if (dbResult.success) {
          console.log('✅ Assessment saved to database');
        }
      }

      console.log('✅ Screen completed:', screenName);
      return true;
    } catch (error) {
      console.error('❌ Failed to mark screen completed:', error);
      return false;
    }
  }, [assessmentState]);

  /**
   * Update assessment responses and scores
   */
  const updateAssessmentData = useCallback((updates) => {
    if (!assessmentState) return false;

    try {
      const updatedState = {
        ...assessmentState,
        assessment: {
          ...assessmentState.assessment,
          ...updates
        },
        timestamp: Date.now()
      };

      setAssessmentState(updatedState);
      saveAssessmentState(updatedState);
      
      console.log('🔄 Assessment data updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update assessment data:', error);
      return false;
    }
  }, [assessmentState]);

  /**
   * Update user lead data and link to assessment
   */
  const updateUserData = useCallback(async (leadData) => {
    if (!assessmentState) return false;

    try {
      const updatedState = {
        ...assessmentState,
        user: {
          ...assessmentState.user,
          leadData,
          leadId: leadData.id
        }
      };

      setAssessmentState(updatedState);
      saveAssessmentState(updatedState);

      // Link assessment to user in database
      if (assessmentState.analytics.sessionId) {
        const linkResult = await linkAssessmentToUser(assessmentState.analytics.sessionId, leadData);
        
        if (linkResult.success) {
          console.log('✅ Assessment linked to user');
        }
      }

      console.log('✅ User data updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update user data:', error);
      return false;
    }
  }, [assessmentState]);

  /**
   * Get next screen in the assessment flow (adaptive path-aware)
   */
  const getNextScreen = useCallback(() => {
    if (!assessmentState) return null;

    const currentScreen = assessmentState.navigation.currentScreen;
    const path = assessmentState.navigation.assessmentPath;
    const completedScreens = assessmentState.navigation.completedScreens;

    // Get the question flow for current path
    const questionFlow = PathLogic.getQuestionFlow(path || "B");
    
    // Find current position in flow
    const currentIndex = questionFlow.indexOf(currentScreen);
    if (currentIndex === -1) {
      // If current screen not in flow, return first incomplete screen
      for (const screen of questionFlow) {
        if (!completedScreens.includes(screen)) {
          return screen;
        }
      }
      return 'loading'; // All questions complete
    }

    // Return next screen in flow
    if (currentIndex < questionFlow.length - 1) {
      return questionFlow[currentIndex + 1];
    }

    // End of question flow, go to processing
    return 'loading';
  }, [assessmentState]);

  /**
   * Get previous screen in the assessment flow (adaptive path-aware)
   */
  const getPreviousScreen = useCallback(() => {
    if (!assessmentState) return null;

    const currentScreen = assessmentState.navigation.currentScreen;
    const path = assessmentState.navigation.assessmentPath;

    // Get the question flow for current path
    const questionFlow = PathLogic.getQuestionFlow(path || "B");
    
    // Find current position in flow
    const currentIndex = questionFlow.indexOf(currentScreen);
    if (currentIndex > 0) {
      return questionFlow[currentIndex - 1];
    }

    return null;
  }, [assessmentState]);

  /**
   * Determine and set assessment path based on current responses
   */
  const determineAssessmentPath = useCallback(() => {
    if (!assessmentState) return;

    const pathInfo = PathLogic.determinePath(assessmentState);
    
    const updatedState = {
      ...assessmentState,
      navigation: {
        ...assessmentState.navigation,
        assessmentPath: pathInfo.path,
        totalQuestions: pathInfo.totalQuestions
      }
    };

    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    
    console.log(`🎯 Assessment path determined: ${pathInfo.path} (${pathInfo.description})`);
    return pathInfo;
  }, [assessmentState]);

  /**
   * Go back to previous screen with score restoration
   */
  const goBack = useCallback(() => {
    if (!assessmentState) return false;

    // Restore last snapshot
    const restoredState = ScoreSnapshots.restoreLastSnapshot(assessmentState);
    
    // Update analytics
    const analyticsUpdate = {
      ...restoredState,
      analytics: {
        ...restoredState.analytics,
        assessmentMetrics: {
          ...restoredState.analytics.assessmentMetrics,
          backNavigationCount: (restoredState.analytics.assessmentMetrics.backNavigationCount || 0) + 1
        }
      }
    };

    setAssessmentState(analyticsUpdate);
    saveAssessmentState(analyticsUpdate);
    
    // Navigate to restored screen
    navigateToScreen(analyticsUpdate.navigation.currentScreen, { 
      replace: true, 
      skipSnapshot: true 
    });
    
    console.log('⬅️ Navigated back with score restoration');
    return true;
  }, [assessmentState, navigateToScreen]);

  /**
   * Check if user can navigate to a specific screen
   */
  const canNavigateTo = useCallback((screenName) => {
    if (!assessmentState) return false;
    return canAccessScreen(screenName, assessmentState);
  }, [assessmentState]);

  /**
   * Get current screen name from URL (enhanced for new assessment components)
   */
  const getCurrentScreen = useCallback(() => {
    const pathname = location.pathname;
    
    if (pathname === '/' || pathname === '/assessment/start') return 'landing';
    
    const path = pathname.replace('/assessment/', '');
    const urlToScreen = {
      'self-select': 'selfSelect',
      'context': 'context',
      'behavioral': 'behavioralFreq', 
      'ai-diet': 'aiDiet',
      'item1': 'item1',
      'item1/results': 'item1_reveal',
      'item2': 'item2',
      'item2/results': 'item2_reveal',
      'item3': 'item3',
      'item3/results': 'item3_reveal',
      'item3b': 'item3b',
      'item3b/results': 'item3b_reveal',
      'item4': 'item4',
      'item4/results': 'item4_reveal',
      'item5a': 'item5a',
      'item5a/results': 'item5a_reveal',
      'item5b': 'item5b',
      'item5b/results': 'item5b_reveal',
      'item6': 'item6',
      'workflow-design': 'workflowDesign',
      'workflow-design/results': 'workflowDesign_reveal',
      'system-builder': 'systemBuilder', 
      'system-builder/results': 'systemBuilder_reveal',
      'processing': 'loading',
      'contact': 'capture',
      'results': 'reveal'
    };
    
    return urlToScreen[path] || 'landing';
  }, [location.pathname]);

  return {
    // State
    assessmentState,
    loading,
    error,
    
    // Navigation functions
    navigateToScreen,
    getCurrentScreen,
    getNextScreen,
    getPreviousScreen,
    canNavigateTo,
    goBack,
    
    // Adaptive assessment functions
    determineAssessmentPath,
    
    // State management functions
    markScreenCompleted,
    updateAssessmentData,
    updateUserData,
    
    // Enhanced scoring functions
    calculateLevel: (scores, responses) => {
      const path = assessmentState?.navigation?.assessmentPath || "B";
      return EnhancedScoring.computeLevel(scores, path, responses);
    },
    
    calculateCalibrationGap: (selfSelected, actual) => {
      return EnhancedScoring.calculateCalibrationGap(selfSelected, actual);
    },
    
    // Utility functions
    isComplete: assessmentState ? isAssessmentComplete(assessmentState) : false,
    progress: assessmentState ? getAssessmentProgress(assessmentState) : 0,
    currentScreen: assessmentState?.navigation.currentScreen || getCurrentScreen(),
    completedScreens: assessmentState?.navigation.completedScreens || [],
    assessmentPath: assessmentState?.navigation.assessmentPath,
    currentQuestionNumber: assessmentState?.navigation.currentQuestionNumber || 0,
    totalQuestions: assessmentState?.navigation.totalQuestions || 8,
    
    // Raw state setter for advanced use cases
    setState: setAssessmentState
  };
};

export default useAssessmentNavigation;