# Enhanced Assessment System - Technical Implementation Specification

## Overview
This document provides detailed specifications for implementing the comprehensive enhanced assessment system based on the modified-flow.jsx analysis and DEV-HANDOFF.md requirements.

## 1. Enhanced State Structure

### 1.1 Updated Default State Schema

```javascript
const DEFAULT_STATE = {
  version: STORAGE_KEYS.VERSION,
  timestamp: Date.now(),
  
  navigation: {
    currentScreen: "landing",
    completedScreens: [],
    lastActiveUrl: "/",
    assessmentPath: null,        // "A", "B", or "C"
    currentQuestionNumber: 0,
    totalQuestions: 0,
    history: [],                 // For score snapshots and back navigation
    skipReasons: {}              // Track why certain questions were skipped
  },
  
  assessment: {
    startTime: null,
    completedAt: null,
    responses: {},
    
    // Enhanced 11-component scoring system
    enhancedScores: {
      // Core assessment scores (original)
      a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, b1: 0,
      
      // New behavioral and calibration scores
      behavFreqScore: 0,          // Behavioral frequency maturity
      dietScore: 0,               // AI tool usage breadth
      featureDepthScore: 0,       // Advanced feature utilization
      calibrationGap: 0,          // Self-assessment vs actual gap
      
      // Advanced question scores (Path C only)
      workflowScore: 0,           // Workflow design capability
      systemBuilderScore: 0,      // Multi-agent orchestration
      
      // Enhanced item scores
      item3bCorrect: false,       // Agreement trap detection
      item6Level: 1,              // Follow-up question sophistication
      
      // Score snapshots for back navigation
      snapshots: []
    },
    
    // Self-assessment and calibration
    calibration: {
      selfSelectedLevel: null,    // User's initial level estimation (0-5)
      actualLevel: null,          // Computed level after assessment
      perceptionGap: 0,           // Difference for sharing content
      overconfident: false        // Flag for overconfidence detection
    },
    
    // Enhanced user profiling
    profile: {
      role: null,                 // Professional role
      company: null,              // Company name
      persona: null,              // User persona/archetype
      useCase: null,              // Primary AI use case
      experience: null,           // AI experience level
      goals: []                   // Learning/improvement goals
    }
  },
  
  results: {
    level: null,
    relationshipStatus: null,
    insights: null,
    
    // Enhanced results data
    levelBreakdown: {
      phase: null,                // Tool User, Co-worker, System Builder
      percentile: null,           // "Top X% of users"
      strengths: [],              // Areas of strength
      improvements: [],           // Areas for improvement
      nextLevel: null             // Next level guidance
    },
    
    // Detailed personality assessment
    personality: {
      archetype: null,            // One of 8 relationship archetypes
      traits: [],                 // Personality traits identified
      workStyle: null,            // How they work with AI
      riskProfile: null           // Risk tolerance with AI
    }
  },
  
  user: {
    leadData: null,
    leadId: null
  },
  
  analytics: {
    sessionId: null,
    firedEvents: [],
    utmData: {},
    sessionReplayUrl: null,
    
    // Enhanced analytics for adaptive assessment
    assessmentMetrics: {
      pathTaken: null,            // A, B, or C
      questionsAnswered: 0,       // Total questions completed
      timeSpent: {},              // Time per question
      backNavigationCount: 0,     // How many times user went back
      autoAdvanceCount: 0,        // How many auto-advances occurred
      calibrationAccuracy: null   // How accurate was self-assessment
    }
  }
}
```

## 2. New Assessment Components

### 2.1 SelfSelect.jsx - Calibration Assessment
**Purpose**: User estimates their AI level (L0-L5) before starting assessment
**Location**: `src/components/assessment/SelfSelect.jsx`

```javascript
// Key Features:
- Radio button selection L0-L5 with descriptions
- Visual level scale display
- "Actually, I'm not sure" option
- Stores selfSelectedLevel for later calibration
- Auto-advance after selection
- Progress bar shows step 1 of X
```

**Props Required**:
- `assessmentContext` - Full assessment context
- `onContinue` - Handler for next screen
- `progressStep` - Current step number
- `progressTotal` - Total steps for this path

### 2.2 Context.jsx - Profile Collection  
**Purpose**: Collect role, company, and persona information
**Location**: `src/components/assessment/Context.jsx`

```javascript
// Key Features:
- Role dropdown (Developer, Manager, Designer, etc.)
- Company text input (optional)
- Persona selection (Individual Contributor, Team Lead, Executive)
- Primary use case selection
- Stores in assessment.profile
- Form validation and continue button
```

### 2.3 BehavioralFrequency.jsx - AI Adoption Patterns
**Purpose**: 4 behavioral scenarios testing AI adoption maturity
**Location**: `src/components/assessment/BehavioralFrequency.jsx`

```javascript
// Behavioral Scenarios:
1. "How often do you use AI for brainstorming?" (Never/Rarely/Sometimes/Often/Always)
2. "When AI gives you content, do you edit it?" (Always/Usually/Sometimes/Rarely/Never)
3. "How do you decide when to use AI?" (Specific criteria/General sense/Experiment/Random)
4. "What's your AI usage pattern?" (Daily/Weekly/Monthly/Rarely)

// Scoring:
- behavFreqScore: 0-4 based on mature AI adoption behaviors
- Higher scores for thoughtful, regular usage patterns
- Lower scores for random or infrequent usage
```

### 2.4 AIDiet.jsx - Tool Usage Assessment
**Purpose**: Multi-select tool usage with depth assessment
**Location**: `src/components/assessment/AIDiet.jsx`

```javascript
// Tool Categories:
- Text AI: ChatGPT, Claude, Gemini, Perplexity
- Code AI: GitHub Copilot, Cursor, Codeium
- Creative AI: DALL-E, Midjourney, Stable Diffusion
- Specialized: Notion AI, Grammarly, Jasper

// Feature Depth Assessment:
- Basic features (simple prompts, one-shot usage)
- Advanced features (custom instructions, chaining, fine-tuning)
- Integration usage (APIs, automation, workflows)

// Scoring:
- dietScore: 0-4 based on tool breadth
- featureDepthScore: 0-4 based on sophistication
```

### 2.5 Item3b.jsx - Agreement Trap Test
**Purpose**: Tests if user catches "yes-man" AI responses
**Location**: `src/components/assessment/Item3b.jsx`

```javascript
// Scenario:
"Your team is considering a new project approach. You ask AI for feedback and get this response..."

[Shows overly agreeable AI response with no critical analysis]

// Options:
A) "Great analysis, exactly what I was thinking"
B) "This seems too agreeable - I'd want pushback and alternatives"  
C) "Good start, but I need more detail"
D) "This covers the basics well"

// Scoring:
- item3bCorrect: true if user selects B (catches agreement trap)
- Only shown on Path B and C (intermediate+ users)
```

### 2.6 WorkflowDesign.jsx - Advanced Workflow (Path C)
**Purpose**: 20-page report workflow design scenario
**Location**: `src/components/assessment/WorkflowDesign.jsx`

```javascript
// Scenario:
"You need to create a comprehensive 20-page market analysis report. How would you structure your AI workflow?"

// Options:
A) One big prompt asking for the full report
B) Break into sections, have AI write each separately  
C) AI for research → Human synthesis → AI for formatting
D) Multiple AI agents with different roles and review steps

// Scoring:
- workflowScore: 0-4 based on sophistication
- Tests system thinking and workflow orchestration
- Required for L5+ level achievement
```

### 2.7 SystemBuilder.jsx - Multi-Agent Orchestration (Path C)
**Purpose**: System building capability assessment
**Location**: `src/components/assessment/SystemBuilder.jsx`

```javascript
// Scenario:
"You're building an AI system to help your sales team. What's your approach?"

// Options:
A) Single AI assistant that handles all sales tasks
B) Multiple specialized AI agents with clear handoffs
C) Human-AI hybrid system with role-based permissions
D) Fully automated pipeline with human oversight points

// Scoring:
- systemBuilderScore: 0-4 based on system design maturity
- Tests L5-L6 "System Builder" capabilities
- Only shown to Path C users (advanced workflow + high diet scores)
```

## 3. Adaptive Path Logic

### 3.1 Path Determination Algorithm

```javascript
function determinePath(state) {
  const { selfSelectedLevel, dietScore, featureDepthScore } = state;
  
  // Path A: Basic users (L0-L2)
  if (selfSelectedLevel <= 2 && dietScore <= 1) {
    return { 
      path: "A", 
      totalQuestions: 8,
      skipQuestions: ["item3b", "workflowDesign", "systemBuilder"]
    };
  }
  
  // Path C: Expert users (L4-L5+ aspirational)  
  if (selfSelectedLevel >= 4 && dietScore >= 3 && featureDepthScore >= 3) {
    return { 
      path: "C", 
      totalQuestions: 12,
      skipQuestions: []
    };
  }
  
  // Path B: Standard users (L2-L4)
  return { 
    path: "B", 
    totalQuestions: 10,
    skipQuestions: ["workflowDesign", "systemBuilder"]
  };
}
```

### 3.2 Question Flow Mapping

```javascript
const QUESTION_FLOWS = {
  "A": [ // Basic Path - 8 questions
    "selfSelect", "context", "behavioralFreq", "aiDiet",
    "item1", "item2", "item3", "item4", "item5a", "item5b", "item6"
  ],
  
  "B": [ // Standard Path - 10 questions
    "selfSelect", "context", "behavioralFreq", "aiDiet", 
    "item1", "item2", "item3", "item3b", "item4", "item5a", "item5b", "item6"
  ],
  
  "C": [ // Expert Path - 12 questions
    "selfSelect", "context", "behavioralFreq", "aiDiet",
    "item1", "item2", "item3", "item3b", "item4", "item5a", "item5b", "item6",
    "workflowDesign", "systemBuilder"
  ]
};
```

## 4. Enhanced Scoring System

### 4.1 Level Calculation Algorithm (Enhanced)

```javascript
function computeEnhancedLevel(scores, path) {
  const {
    a1, a2, a3, a4, a5, b1,
    behavFreqScore, dietScore, featureDepthScore,
    workflowScore, systemBuilderScore,
    item3Correct, item3bCorrect, item6Level
  } = scores;

  // Calculate base score
  let total = a1 + a2 + a3 + a4 + a5 + b1 + behavFreqScore + dietScore;
  
  // Apply gatekeeper rules (same as original)
  if (!item3Correct) total = Math.min(total, 8);  // Cap at L2 if failed artifact effect
  if (a4 <= 2) total = Math.min(total, 12);       // Cap at L3 if poor iteration
  
  // Path C bonus scoring
  if (path === "C") {
    total += workflowScore + systemBuilderScore;
    
    // L5 requirements (from DEV-HANDOFF.md)
    const meetsL5Requirements = (
      workflowScore >= 3 && 
      systemBuilderScore >= 3 && 
      total >= 18 && 
      item6Level >= 3 && 
      featureDepthScore >= 3
    );
    
    if (meetsL5Requirements) {
      return Math.min(5, Math.floor(total / 4)); // Max L5, L6 is aspirational
    }
  }
  
  // Standard level calculation
  if (total >= 16) return 4;
  if (total >= 12) return 3;
  if (total >= 8) return 2;
  if (total >= 4) return 1;
  return 0;
}
```

### 4.2 Score Snapshots System

```javascript
class ScoreSnapshots {
  static takeSnapshot(state) {
    return {
      timestamp: Date.now(),
      screen: state.navigation.currentScreen,
      scores: { ...state.assessment.enhancedScores },
      responses: { ...state.assessment.responses }
    };
  }
  
  static saveSnapshot(state, snapshot) {
    return {
      ...state,
      assessment: {
        ...state.assessment,
        enhancedScores: {
          ...state.assessment.enhancedScores,
          snapshots: [...state.assessment.enhancedScores.snapshots, snapshot]
        }
      }
    };
  }
  
  static restoreLastSnapshot(state) {
    const snapshots = state.assessment.enhancedScores.snapshots;
    if (snapshots.length === 0) return state;
    
    const lastSnapshot = snapshots[snapshots.length - 1];
    
    return {
      ...state,
      assessment: {
        ...state.assessment,
        enhancedScores: lastSnapshot.scores,
        responses: lastSnapshot.responses
      },
      navigation: {
        ...state.navigation,
        currentScreen: lastSnapshot.screen
      }
    };
  }
}
```

## 5. Navigation System Updates

### 5.1 Enhanced useAssessmentNavigation Hook

**Key Updates Required**:

1. **Path-aware navigation**:
   ```javascript
   const getNextScreen = useCallback(() => {
     const path = assessmentState.navigation.assessmentPath;
     const questionFlow = QUESTION_FLOWS[path];
     // Return next screen based on current path
   }, [assessmentState]);
   ```

2. **Score snapshot integration**:
   ```javascript
   const navigateToScreen = useCallback((screenName, options = {}) => {
     // Take snapshot before navigation
     const snapshot = ScoreSnapshots.takeSnapshot(assessmentState);
     const updatedState = ScoreSnapshots.saveSnapshot(assessmentState, snapshot);
     // Continue with navigation...
   }, [assessmentState]);
   ```

3. **Dynamic progress calculation**:
   ```javascript
   const getProgressPercentage = useCallback(() => {
     const path = assessmentState.navigation.assessmentPath;
     const totalSteps = QUESTION_FLOWS[path].length;
     const currentStep = assessmentState.navigation.currentQuestionNumber;
     return Math.round((currentStep / totalSteps) * 100);
   }, [assessmentState]);
   ```

### 5.2 Updated AssessmentRouter Routes

**New Routes to Add**:
```javascript
// Self-select calibration
<Route path="self-select" element={
  <AssessmentRoute screen="selfSelect" context={assessmentContext}>
    <SelfSelect />
  </AssessmentRoute>
} />

// Context collection  
<Route path="context" element={
  <AssessmentRoute screen="context" context={assessmentContext}>
    <Context />
  </AssessmentRoute>
} />

// Behavioral frequency
<Route path="behavioral" element={
  <AssessmentRoute screen="behavioralFreq" context={assessmentContext}>
    <BehavioralFrequency />
  </AssessmentRoute>
} />

// AI diet assessment
<Route path="ai-diet" element={
  <AssessmentRoute screen="aiDiet" context={assessmentContext}>
    <AIDiet />
  </AssessmentRoute>
} />

// Item3b agreement trap
<Route path="item3b" element={
  <AssessmentRoute screen="item3b" context={assessmentContext}>
    <Item3b />
  </AssessmentRoute>
} />

// Advanced Path C components
<Route path="workflow-design" element={
  <AssessmentRoute screen="workflowDesign" context={assessmentContext}>
    <WorkflowDesign />
  </AssessmentRoute>
} />

<Route path="system-builder" element={
  <AssessmentRoute screen="systemBuilder" context={assessmentContext}>
    <SystemBuilder />
  </AssessmentRoute>
} />
```

## 6. Auto-Progression System

### 6.1 Timer-Based Auto-Advance

**Implementation in Reveal Components**:
```javascript
function Item1Reveal({ assessmentContext }) {
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [countdown, setCountdown] = useState(4);
  
  useEffect(() => {
    if (!autoAdvanceEnabled) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          assessmentContext.handlers.handleRevealContinue(getNextScreen());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [autoAdvanceEnabled]);
  
  return (
    <div>
      {/* Reveal content */}
      
      {/* Auto-advance controls */}
      <div className="mt-6 flex items-center justify-between">
        <button 
          onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
          className="text-sm text-gray-400 hover:text-white"
        >
          {autoAdvanceEnabled ? '⏸️ Pause' : '▶️ Resume'} auto-advance
        </button>
        
        {autoAdvanceEnabled && (
          <span className="text-sm text-gray-400">
            Continuing in {countdown}s...
          </span>
        )}
        
        <button
          onClick={() => assessmentContext.handlers.handleRevealContinue(getNextScreen())}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

### 6.2 Smart Auto-Scroll

**Implementation for Question Components**:
```javascript
function useAutoScroll(trigger) {
  const scrollTargetRef = useRef(null);
  
  useEffect(() => {
    if (trigger && scrollTargetRef.current) {
      setTimeout(() => {
        scrollTargetRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [trigger]);
  
  return scrollTargetRef;
}
```

## 7. Enhanced Progress Indicators

### 7.1 Dynamic Progress Bar Component

**Updated ProgressBar.jsx**:
```javascript
function ProgressBar({ 
  current, 
  total, 
  path, 
  showStepNumbers = true,
  showPathIndicator = true 
}) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Path indicator */}
      {showPathIndicator && (
        <div className="text-center mb-2">
          <span className="text-xs text-blue-400/60 font-medium">
            Path {path} • {getPathDescription(path)}
          </span>
        </div>
      )}
      
      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 bg-gray-800/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Step numbers */}
        {showStepNumbers && (
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Step {current}</span>
            <span>{total} total</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getPathDescription(path) {
  switch(path) {
    case "A": return "Essential Assessment";
    case "B": return "Complete Assessment";  
    case "C": return "Expert Assessment";
    default: return "AI Level Assessment";
  }
}
```

## 8. Database Schema Updates

### 8.1 Enhanced Assessment Table

**Required new columns for ai_level_assessments**:
```sql
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS assessment_path VARCHAR(1); -- A, B, or C
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS self_selected_level INTEGER;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS calibration_gap INTEGER;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS enhanced_scores JSONB;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS profile_data JSONB;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS assessment_metrics JSONB;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS auto_advance_count INTEGER DEFAULT 0;
ALTER TABLE ai_level_assessments ADD COLUMN IF NOT EXISTS back_navigation_count INTEGER DEFAULT 0;
```

### 8.2 Migration Script Update

**Enhanced migrate-database.js**:
```javascript
export async function migrateToEnhancedAssessment() {
  // Migrate existing assessment records to new schema
  // Add default values for new fields
  // Create indexes for new query patterns
  // Backup existing data before migration
}
```

## 9. Implementation Order

### Phase 1: Foundation (Days 1-2)
1. ✅ Enhanced state structure in stateManager.js
2. ✅ Updated navigation hook with path support
3. ✅ Score snapshots system implementation
4. ✅ Database schema migration

### Phase 2: Core Assessment Components (Days 3-5)
5. ✅ SelfSelect.jsx component
6. ✅ Context.jsx component  
7. ✅ BehavioralFrequency.jsx component
8. ✅ AIDiet.jsx component
9. ✅ Updated scoring system with 11 components

### Phase 3: Advanced Components (Days 6-7)
10. ✅ Item3b.jsx component
11. ✅ WorkflowDesign.jsx component
12. ✅ SystemBuilder.jsx component
13. ✅ Path determination logic

### Phase 4: UX Enhancements (Days 8-9)
14. ✅ Auto-progression system
15. ✅ Enhanced progress indicators
16. ✅ Smart auto-scroll
17. ✅ Back navigation with score restoration

### Phase 5: Integration & Testing (Days 10-11)
18. ✅ AssessmentRouter updates with all new routes
19. ✅ Enhanced analytics tracking
20. ✅ Database integration testing
21. ✅ End-to-end flow validation

This specification provides the complete technical roadmap for implementing the enhanced assessment system. Each component can be built incrementally while maintaining compatibility with the existing system.