/**
 * Assessment Router Component
 * Handles routing for all assessment screens with state management
 */

import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { loadAssessmentState, saveAssessmentState, PathLogic, EnhancedScoring } from '../utils/stateManager.js';
import { trackAnalyticsEvent, scoreLLMResponse } from '../supabase.js';
import useAssessmentNavigation from '../hooks/useAssessmentNavigation.js';

// Import assessment screen components
import AssessmentRoute from './AssessmentRoute.jsx';
import AssessmentRedirect from './AssessmentRedirect.jsx';

// Enhanced assessment components
import SelfSelect from './assessment/SelfSelect.jsx';
import Context from './assessment/Context.jsx';
import BehavioralFrequency from './assessment/BehavioralFrequency.jsx';
import AIDiet from './assessment/AIDiet.jsx';

// Original assessment components
import Item1 from './assessment/Item1.jsx';
import Item1Reveal from './assessment/Item1Reveal.jsx';
import Item2 from './assessment/Item2.jsx';
import Item2Reveal from './assessment/Item2Reveal.jsx';
import Item3 from './assessment/Item3.jsx';
import Item3Reveal from './assessment/Item3Reveal.jsx';

// Enhanced question components
import Item3b from './assessment/Item3b.jsx';
import Item3bReveal from './assessment/Item3bReveal.jsx';
import Item4 from './assessment/Item4.jsx';
import Item4Reveal from './assessment/Item4Reveal.jsx';
import Item5a from './assessment/Item5a.jsx';
import Item5aReveal from './assessment/Item5aReveal.jsx';
import Item5b from './assessment/Item5b.jsx';
import Item5bReveal from './assessment/Item5bReveal.jsx';
import Item6 from './assessment/Item6.jsx';

// Advanced Path C components
import WorkflowDesign from './assessment/WorkflowDesign.jsx';
import WorkflowDesignReveal from './assessment/WorkflowDesignReveal.jsx';
import SystemBuilder from './assessment/SystemBuilder.jsx';
import SystemBuilderReveal from './assessment/SystemBuilderReveal.jsx';

// Results and processing components
import LoadingScreen from './assessment/LoadingScreen.jsx';
import LeadCapture from './assessment/LeadCapture.jsx';
import LevelReveal from './assessment/LevelReveal.jsx';

// Placeholder for components not yet extracted
const PlaceholderComponent = ({ title }) => (
  <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-gray-400">Component will be extracted from App.jsx</p>
    </div>
  </div>
);

const AssessmentRouter = () => {
  const [assessmentState, setAssessmentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Load assessment state on mount
  useEffect(() => {
    const initializeState = async () => {
      try {
        const state = await loadAssessmentState();
        setAssessmentState(state);
        console.log('🔄 Assessment state initialized:', state.navigation.currentScreen);
      } catch (error) {
        console.error('❌ Failed to initialize assessment state:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeState();
  }, []);

  // Initialize navigation functions
  const navigation = useAssessmentNavigation();

  // Update state when URL changes
  useEffect(() => {
    if (!assessmentState || loading) return;

    const urlToScreen = (pathname) => {
      const path = pathname.replace('/assessment/', '');
      
      // Enhanced URL mapping with new assessment components
      const urlMap = {
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

      return urlMap[path] || 'selfSelect'; // Default to self-select for new flow
    };

    const currentScreen = urlToScreen(location.pathname);
    
    // Update state if screen changed
    if (currentScreen !== assessmentState.navigation.currentScreen) {
      const updatedState = {
        ...assessmentState,
        navigation: {
          ...assessmentState.navigation,
          currentScreen,
          lastActiveUrl: location.pathname
        }
      };
      
      setAssessmentState(updatedState);
      saveAssessmentState(updatedState);
      console.log('🔄 Screen changed via URL:', currentScreen);
    }
  }, [location.pathname, assessmentState, loading]);

  // Update URL when state changes (programmatic navigation) - Enhanced
  const updateUrl = (screen) => {
    const screenToUrl = (screenName) => {
      const urlMap = {
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

      return urlMap[screenName] || '/assessment/self-select';
    };

    const targetUrl = screenToUrl(screen);
    if (location.pathname !== targetUrl) {
      navigate(targetUrl, { replace: false });
    }
  };

  // Navigation handlers for each question
  const handleItem1 = (choice) => {
    const correct = choice === "A";
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item1: choice
        },
        scores: {
          ...assessmentState.assessment.scores,
          a3: assessmentState.assessment.scores.a3 + (correct ? 1 : 0)
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item1'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { item: 1, choice, correct });
    updateUrl('item1_reveal');
  };

  const handleItem2 = (ratings) => {
    let correct = 0;
    if (ratings.email === "Nail it") correct++;
    if (ratings.finance === "Fail") correct++;
    if (ratings.social === "Be OK") correct++;
    if (ratings.mailbox === "Fail") correct++;
    const a1Score = correct >= 3 ? 3 : correct >= 2 ? 2 : correct >= 1 ? 1 : 0;
    const b1Adj = ratings.finance !== "Fail" ? -1 : 0;
    
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item2: ratings
        },
        scores: {
          ...assessmentState.assessment.scores,
          a1: a1Score,
          b1: assessmentState.assessment.scores.b1 + b1Adj,
          item2Correct: correct
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item2'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { item: 2, ratings, correct });
    updateUrl('item2_reveal');
  };

  const handleItem3 = (choice, confidence) => {
    const correct = choice === "B";
    let a3Add = 0;
    let b1Add = 0;
    if (correct && confidence === "Very sure") { a3Add = 4; b1Add = 2; }
    else if (correct && confidence === "Somewhat") { a3Add = 3; b1Add = 1; }
    else if (correct) { a3Add = 1; }
    else if (!correct && confidence === "Very sure") { b1Add = -1; }
    
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item3: { choice, confidence }
        },
        scores: {
          ...assessmentState.assessment.scores,
          a3: assessmentState.assessment.scores.a3 + a3Add,
          b1: assessmentState.assessment.scores.b1 + b1Add,
          item3Correct: correct
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item3'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { item: 3, choice, confidence, correct });
    updateUrl('item3_reveal');
  };

  const handleItem4 = (choice) => {
    const scoreMap = { A: 1, B: 2, C: 4, D: 4 };
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item4: choice
        },
        scores: {
          ...assessmentState.assessment.scores,
          a4: scoreMap[choice],
          item4Choice: choice
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item4'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { item: 4, choice });
    updateUrl('item4_reveal');
  };

  const handleItem5a = (apology, allergy) => {
    const restraint = (!apology ? 1 : 0) + (!allergy ? 1 : 0);
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item5a: { apology, allergy }
        },
        scores: {
          ...assessmentState.assessment.scores,
          a1: assessmentState.assessment.scores.a1 + restraint,
          restraintScore: restraint,
          apologyAnswer: apology,
          allergyAnswer: allergy
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item5a'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { item: '5a', apology, allergy, restraintScore: restraint });
    updateUrl('item5a_reveal');
  };

  const handleItem5b = async (text) => {
    // Use LLM scoring with keyword fallback (same as original)
    const llmResult = await scoreLLMResponse('5b', text);

    let level;
    if (llmResult.useFallback) {
      // Import and use the scorePromptFix function for fallback
      const scorePromptFix = (text) => {
        const t = text.toLowerCase();
        const l3Keywords = ["closing", "close rate", "diagnose", "weakness", "pipeline", "specific", "mindset", "strategy", "lost deals", "proposal stage", "real time"];
        const l2Keywords = ["experience", "years", "industry", "focus on", "improve my", "without", "freelancer", "enterprise", "beginner"];
        let l3Count = l3Keywords.filter(k => t.includes(k)).length;
        let l2Count = l2Keywords.filter(k => t.includes(k)).length;
        return l3Count >= 2 ? 3 : (l3Count >= 1 || l2Count >= 2) ? 2 : 1;
      };
      level = scorePromptFix(text);
      console.log('🔄 Using keyword scoring for Item 5B:', level);
    } else {
      level = llmResult.score;
      console.log('🤖 Using LLM scoring for Item 5B:', level, llmResult.reasoning);
    }

    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item5b: text
        },
        scores: {
          ...assessmentState.assessment.scores,
          a2: level,
          promptLevel: level
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item5b'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { 
      item: '5b', 
      promptLevel: level, 
      textLength: text.length,
      scoringMethod: llmResult.useFallback ? 'keyword' : 'llm'
    });
    updateUrl('item5b_reveal');
  };

  const handleItem6 = async (text) => {
    // Use LLM scoring with keyword fallback (same as original)
    const llmResult = await scoreLLMResponse('6', text);

    let level;
    if (llmResult.useFallback) {
      // Import and use the scoreFollowUp function for fallback
      const scoreFollowUp = (text) => {
        const t = text.toLowerCase();
        const l4Keywords = ["bet against", "opposite", "competitor", "disagree", "abandon", "same data"];
        const l3Keywords = ["assumption", "what if", "counterargument", "wrong", "unrealistic", "actually", "not seeing", "strongest argument", "reframe", "challenge"];
        const l2Keywords = ["morale", "specific", "numbers", "how much", "break down", "factor", "burnout", "another"];
        const l1Keywords = ["bullet", "shorter", "detail", "explain", "format", "summary"];
        if (l4Keywords.some(k => t.includes(k))) return 4;
        if (l3Keywords.filter(k => t.includes(k)).length >= 1) return 3;
        if (l2Keywords.some(k => t.includes(k))) return 2;
        if (l1Keywords.some(k => t.includes(k)) || t.length < 30) return 1;
        return 2;
      };
      level = scoreFollowUp(text);
      console.log('🔄 Using keyword scoring for Item 6:', level);
    } else {
      level = llmResult.score;
      console.log('🤖 Using LLM scoring for Item 6:', level, llmResult.reasoning);
    }

    const scoreMap = { 1: 1, 2: 2, 3: 4, 4: 5 };
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item6: text
        },
        scores: {
          ...assessmentState.assessment.scores,
          a5: scoreMap[level] || 2,
          item6Level: level
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item6'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { 
      item: 6, 
      followUpLevel: level, 
      textLength: text.length,
      scoringMethod: llmResult.useFallback ? 'keyword' : 'llm'
    });
    updateUrl('loading');
  };

  // Continue handlers for reveal screens
  const handleRevealContinue = (nextScreen) => {
    // Mark current reveal screen as completed
    const currentScreen = assessmentState.navigation.currentScreen;
    const updatedState = {
      ...assessmentState,
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, currentScreen])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    updateUrl(nextScreen);
  };

  // ===== ENHANCED ASSESSMENT HANDLERS =====

  // SelfSelect Handler - Calibration assessment  
  const handleSelfSelect = (selectedLevel, isUnsure = false) => {
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          selfSelect: { selectedLevel, isUnsure }
        },
        calibration: {
          ...assessmentState.assessment.calibration,
          selfSelectedLevel: isUnsure ? 2 : selectedLevel // Default to L2 if unsure
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'selfSelect'])],
        currentQuestionNumber: 1
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('self_select_completed', { selectedLevel, isUnsure });
    updateUrl('context');
  };

  // Context Handler - Profile collection (Updated for modified flow structure)
  const handleContext = (contextData) => {
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          context: contextData
        },
        profile: {
          ...assessmentState.assessment.profile,
          persona: contextData.persona,
          role: contextData.role,
          company: contextData.company
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'context'])],
        currentQuestionNumber: 2
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('context_completed', contextData);
    updateUrl('behavioralFreq');
  };

  // BehavioralFrequency Handler - AI adoption patterns
  const handleBehavioralFrequency = (responses, behavFreqScore) => {
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          behavioralFreq: responses
        },
        enhancedScores: {
          ...assessmentState.assessment.enhancedScores,
          behavFreqScore: behavFreqScore
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'behavioralFreq'])],
        currentQuestionNumber: 3
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('behavioral_freq_completed', { responses, behavFreqScore });
    updateUrl('aiDiet');
  };

  // AIDiet Handler - Tool usage assessment with path determination
  const handleAIDiet = (dietData) => {
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          aiDiet: dietData
        },
        enhancedScores: {
          ...assessmentState.assessment.enhancedScores,
          dietScore: dietData.dietScore,
          featureDepthScore: dietData.featureDepthScore
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'aiDiet'])],
        currentQuestionNumber: 4
      }
    };

    // Determine assessment path after AIDiet completion
    const pathInfo = PathLogic.determinePath(updatedState);
    updatedState.navigation.assessmentPath = pathInfo.path;
    updatedState.navigation.totalQuestions = pathInfo.totalQuestions;
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('ai_diet_completed', { 
      ...dietData, 
      pathDetermined: pathInfo.path,
      totalQuestions: pathInfo.totalQuestions 
    });
    
    console.log(`🎯 Assessment path determined: ${pathInfo.path} - ${pathInfo.description}`);
    updateUrl('item1');
  };

  // Item3b Handler - Agreement trap test
  const handleItem3b = (choice) => {
    const correct = choice === "B"; // Option B catches the agreement trap
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          item3b: choice
        },
        enhancedScores: {
          ...assessmentState.assessment.enhancedScores,
          item3bCorrect: correct
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'item3b'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('item_completed', { item: '3b', choice, correct });
    updateUrl('item3b_reveal');
  };

  // WorkflowDesign Handler - Advanced workflow assessment (Path C)
  const handleWorkflowDesign = (choice) => {
    const scoreMap = { A: 1, B: 2, C: 3, D: 4 };
    const workflowScore = scoreMap[choice];
    
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          workflowDesign: choice
        },
        enhancedScores: {
          ...assessmentState.assessment.enhancedScores,
          workflowScore: workflowScore
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'workflowDesign'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('workflow_design_completed', { choice, workflowScore });
    updateUrl('workflowDesign_reveal');
  };

  // SystemBuilder Handler - Multi-agent orchestration (Path C)
  const handleSystemBuilder = (checkedItems, systemBuilderScore) => {
    const updatedState = {
      ...assessmentState,
      assessment: {
        ...assessmentState.assessment,
        responses: {
          ...assessmentState.assessment.responses,
          systemBuilder: checkedItems
        },
        enhancedScores: {
          ...assessmentState.assessment.enhancedScores,
          systemBuilderScore: systemBuilderScore
        }
      },
      navigation: {
        ...assessmentState.navigation,
        completedScreens: [...new Set([...assessmentState.navigation.completedScreens, 'systemBuilder'])]
      }
    };
    
    setAssessmentState(updatedState);
    saveAssessmentState(updatedState);
    trackAnalyticsEvent('system_builder_completed', { systemBuilderScore, checkedCount: Object.values(checkedItems).filter(Boolean).length });
    updateUrl('systemBuilder_reveal');
  };

  // Provide context to child components
  const assessmentContext = {
    state: assessmentState,
    setState: setAssessmentState,
    updateUrl,
    saveState: () => saveAssessmentState(assessmentState),
    navigation,
    handlers: {
      // Original handlers
      handleItem1,
      handleItem2,
      handleItem3,
      handleItem4,
      handleItem5a,
      handleItem5b,
      handleItem6,
      handleRevealContinue,
      
      // Enhanced assessment handlers
      handleSelfSelect,
      handleContext,
      handleBehavioralFrequency,
      handleAIDiet,
      handleItem3b,
      handleWorkflowDesign,
      handleSystemBuilder
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Routes>
        {/* Root assessment path redirects to self-select for new enhanced flow */}
        <Route 
          path="" 
          element={<Navigate to="/assessment/self-select" replace />} 
        />

        {/* Enhanced Assessment Components - New Flow */}
        <Route 
          path="self-select" 
          element={
            <AssessmentRoute screen="selfSelect" context={assessmentContext}>
              <SelfSelect assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="context" 
          element={
            <AssessmentRoute screen="context" context={assessmentContext}>
              <Context assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        <Route 
          path="behavioral" 
          element={
            <AssessmentRoute screen="behavioralFreq" context={assessmentContext}>
              <BehavioralFrequency assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        <Route 
          path="ai-diet" 
          element={
            <AssessmentRoute screen="aiDiet" context={assessmentContext}>
              <AIDiet assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Original Assessment Items - Updated with context */}
        <Route 
          path="item1" 
          element={
            <AssessmentRoute screen="item1" context={assessmentContext}>
              <Item1 assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item1/results" 
          element={
            <AssessmentRoute screen="item1_reveal" context={assessmentContext}>
              <Item1Reveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 2 */}
        <Route 
          path="item2" 
          element={
            <AssessmentRoute screen="item2" context={assessmentContext}>
              <Item2 assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item2/results" 
          element={
            <AssessmentRoute screen="item2_reveal" context={assessmentContext}>
              <Item2Reveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 3 */}
        <Route 
          path="item3" 
          element={
            <AssessmentRoute screen="item3" context={assessmentContext}>
              <Item3 assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item3/results" 
          element={
            <AssessmentRoute screen="item3_reveal" context={assessmentContext}>
              <Item3Reveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 3b - Agreement Trap (Path B & C) */}
        <Route 
          path="item3b" 
          element={
            <AssessmentRoute screen="item3b" context={assessmentContext}>
              <Item3b assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item3b/results" 
          element={
            <AssessmentRoute screen="item3b_reveal" context={assessmentContext}>
              <Item3bReveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 4 */}
        <Route 
          path="item4" 
          element={
            <AssessmentRoute screen="item4" context={assessmentContext}>
              <Item4 assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item4/results" 
          element={
            <AssessmentRoute screen="item4_reveal" context={assessmentContext}>
              <Item4Reveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 5A */}
        <Route 
          path="item5a" 
          element={
            <AssessmentRoute screen="item5a" context={assessmentContext}>
              <Item5a assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item5a/results" 
          element={
            <AssessmentRoute screen="item5a_reveal" context={assessmentContext}>
              <Item5aReveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 5B */}
        <Route 
          path="item5b" 
          element={
            <AssessmentRoute screen="item5b" context={assessmentContext}>
              <Item5b assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="item5b/results" 
          element={
            <AssessmentRoute screen="item5b_reveal" context={assessmentContext}>
              <Item5bReveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Item 6 */}
        <Route 
          path="item6" 
          element={
            <AssessmentRoute screen="item6" context={assessmentContext}>
              <Item6 assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Advanced Path C Components */}
        <Route 
          path="workflow-design" 
          element={
            <AssessmentRoute screen="workflowDesign" context={assessmentContext}>
              <WorkflowDesign assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="workflow-design/results" 
          element={
            <AssessmentRoute screen="workflowDesign_reveal" context={assessmentContext}>
              <WorkflowDesignReveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        <Route 
          path="system-builder" 
          element={
            <AssessmentRoute screen="systemBuilder" context={assessmentContext}>
              <SystemBuilder assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />
        
        <Route 
          path="system-builder/results" 
          element={
            <AssessmentRoute screen="systemBuilder_reveal" context={assessmentContext}>
              <SystemBuilderReveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Processing/Loading */}
        <Route 
          path="processing" 
          element={
            <AssessmentRoute screen="loading" context={assessmentContext}>
              <LoadingScreen assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Contact Form */}
        <Route 
          path="contact" 
          element={
            <AssessmentRoute screen="capture" context={assessmentContext}>
              <LeadCapture assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Final Results */}
        <Route 
          path="results" 
          element={
            <AssessmentRoute screen="reveal" context={assessmentContext}>
              <LevelReveal assessmentContext={assessmentContext} />
            </AssessmentRoute>
          } 
        />

        {/* Default redirect */}
        <Route 
          path="*" 
          element={
            <AssessmentRedirect 
              assessmentState={assessmentState}
              context={assessmentContext}
            />
          } 
        />
      </Routes>
    </div>
  );
};

export default AssessmentRouter;