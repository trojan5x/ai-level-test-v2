import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { captureLeadData, captureIntentData, trackAnalyticsEvent, scoreLLMResponse } from "./supabase.js";
import { utmTracker } from './utils/utmTracker.js';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminDashboard from './admin/components/AdminDashboard.jsx';

// Reusable Header Component
function Header() {
  return (
    <div className="w-full bg-gray-900/60 border-b border-gray-800/40 backdrop-blur-sm py-4 z-20 relative">
      <div className="flex items-center justify-center">
        {/* LearnTube Logo */}
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

const SCREENS = {
  LANDING: "landing",
  ITEM1: "item1",
  ITEM1_REVEAL: "item1_reveal",
  ITEM2: "item2",
  ITEM2_REVEAL: "item2_reveal",
  ITEM3: "item3",
  ITEM3_REVEAL: "item3_reveal",
  ITEM4: "item4",
  ITEM4_REVEAL: "item4_reveal",
  ITEM5A: "item5a",
  ITEM5A_REVEAL: "item5a_reveal",
  ITEM5B: "item5b",
  ITEM5B_REVEAL: "item5b_reveal",
  ITEM6: "item6",
  LOADING: "loading",
  CAPTURE: "capture",
  REVEAL: "reveal",
};

// ─── Scoring Engine ──────────────────────────────────────
function computeLevel(scores) {
  const total = scores.a1 + scores.a2 + scores.a3 + scores.a4 + scores.a5;
  const item3Correct = scores.item3Correct;
  const item4Choice = scores.item4Choice;
  const item6Level = scores.item6Level;

  console.log(`\n🏆 FINAL SCORE CALCULATION:`);
  console.log(`- Total Points: ${total} (Needs 18+ for L4)`);
  console.log(`- Item 3 Correct: ${item3Correct} (Gatekeeper: Must be true)`);
  console.log(`- Item 4 Choice: ${item4Choice} (Gatekeeper: Must be C or D)`);
  console.log(`- Item 6 Level: ${item6Level} (Gatekeeper: Needs 3+ for L4)`);

  // L0: Very low engagement / scores
  if (total <= 4) return 0;
  // L1: Low total, limited understanding
  if (total <= 7) return 1;
  // L2 ceiling: Artifact Effect gatekeeper — wrong on Item 3 caps at L2
  // Also: accepting or polishing AI output (A/B on Item 4) caps at L2
  if (!item3Correct || item4Choice === "A" || item4Choice === "B") return 2;
  // L4: High total + deep follow-up + passed all gatekeepers
  if (total >= 18 && item6Level >= 3) return 4;
  // L3: Passed gatekeepers (Item 3 correct, Item 4 C/D)
  if (item3Correct && (item4Choice === "C" || item4Choice === "D")) return 3;
  return 2;
}

function getPercentile(level) {
  const map = { 0: 95, 1: 65, 2: 34, 3: 12, 4: 5, 5: 2, 6: 1 };
  return map[level] || 34;
}

const LEVEL_DATA = {
  0: {
    name: "Non-User",
    tagline: "You haven't started yet — and that's fine. You're about to skip everyone else's mistakes.",
    color: "#64748b",
    tier: "Explorer",
  },
  1: {
    name: "Experimenter",
    tagline: "You've dipped your toes in. The gap between where you are and where AI could take you is bigger than you'd guess.",
    color: "#818cf8",
    tier: "Explorer",
  },
  2: {
    name: "Functional User",
    tagline: "You're getting real value from AI — but you're trusting the polish more than you should.",
    color: "#3b82f6",
    tier: "Practitioner",
  },
  3: {
    name: "Effective Practitioner",
    tagline: "You have judgment most people lack. You don't just use AI — you think with it.",
    color: "#10b981",
    tier: "Operator",
  },
  4: {
    name: "AI-Native Performer",
    tagline: "AI isn't a tool you use — it's how you work. Most people won't understand your workflow for another two years.",
    color: "#f59e0b",
    tier: "Strategist",
  },
  5: {
    name: "AI-Native Builder",
    tagline: "You don't just use AI — you build systems that make other people better at it.",
    color: "#f97316",
    tier: "Architect",
  },
  6: {
    name: "Frontier Contributor",
    tagline: "You're not just mastering the practice — you're advancing it. The frontier moves because of people like you.",
    color: "#ef4444",
    tier: "Pioneer",
  },
};

// ─── AI Relationship Status ─────────────────────────────
const RELATIONSHIP_DATA = {
  single: {
    status: "Single",
    tier: "Pre-Tool",
    emoji: "💤",
    color: "#94a3b8",
    tagline: "You and AI haven't really met yet.",
    description: "No meaningful relationship with AI. You've heard of it, maybe tried it once, but it's not part of your life.",
  },
  casual: {
    status: "Casual",
    tier: "Tool",
    emoji: "👋",
    color: "#a78bfa",
    tagline: "You use AI when it's convenient — nothing serious.",
    description: "AI is a tool you pick up and put down. You get some value but haven't built a working relationship.",
  },
  committed: {
    status: "Committed",
    tier: "Colleague",
    emoji: "🤝",
    color: "#60a5fa",
    tagline: "You and AI have a real working relationship.",
    description: "You delegate, evaluate, and iterate with intention. AI has judgment you respect — and boundaries you enforce.",
  },
  merged: {
    status: "Merged",
    tier: "Symbiont",
    emoji: "🧬",
    color: "#34d399",
    tagline: "AI is part of how you think. The line is blurring.",
    description: "Your thinking and AI's are intertwined. You can't easily separate what you produce from what you co-produce.",
  },
  complicated: {
    status: "It's Complicated",
    tier: "Pet / Mixed",
    emoji: "🌀",
    color: "#fbbf24",
    tagline: "Your signals don't match. Something interesting is happening.",
    description: "You show signs of deep skill in some areas but dependency or blind spots in others. The gap is where the growth lives.",
  },
};

function computeRelationshipStatus(scores, level) {
  const petSignals = [
    !scores.item3Correct,
    scores.restraintScore === 0,
    scores.item4Choice === "A",
  ].filter(Boolean).length;

  const colleagueSignals = [
    scores.item3Correct,
    scores.item4Choice === "C" || scores.item4Choice === "D",
    scores.restraintScore >= 2,
    scores.item6Level >= 3,
  ].filter(Boolean).length;

  if (level >= 3 && petSignals >= 2) return "complicated";
  if (level <= 1 && colleagueSignals >= 2) return "complicated";
  if (level >= 3 && colleagueSignals >= 3) return "merged";
  if (colleagueSignals >= 2 && level >= 2) return "committed";
  if (level === 0) return "single";
  if (petSignals >= 2) return "complicated";
  return "casual";
}

// ─── Improvement Suggestions ────────────────────────────
function getImprovementSuggestions(level, relationshipStatus) {
  const levelTips = {
    0: [
      "Try using AI for one real task this week — not a test, something you actually need done.",
      "Start with writing tasks: emails, summaries, brainstorms. AI is strongest where stakes are low and volume is high.",
    ],
    1: [
      "Give AI more context. Instead of 'help me with X,' tell it who you are, what you need, and what good looks like.",
      "After every AI response, ask yourself: 'Would I send this as-is?' If yes, you're probably not pushing hard enough.",
    ],
    2: [
      "When AI gives you something that looks good, pause and ask: 'Is this actually saying something specific?' That single question separates Level 2 from Level 3.",
      "Stop iterating on format. Start iterating on reasoning. Ask AI to justify its approach, not just polish its output.",
    ],
    3: [
      "Build your AI interactions into repeatable systems. The judgment you have should be encoded, not repeated manually each time.",
      "Start designing workflows where AI handles the right steps and you handle the rest — don't just add AI to existing processes.",
    ],
    4: [
      "You're at the frontier of individual performance. The next multiplier is helping others get here — teaching, building systems, sharing patterns.",
      "Challenge yourself: what would your work look like if AI could do 10x what it does today? Design for that future now.",
    ],
  };

  const relationshipTips = {
    single: "Your first step isn't learning prompts — it's finding one real problem AI can solve for you. The relationship starts with a real need.",
    casual: "You're treating AI like a search engine with extra steps. Try giving it a real problem and having a 5-turn conversation. See what happens when you push back on its first answer.",
    committed: "You've built a real working relationship. The next step is knowing when AI's judgment should override yours in specific domains — and when yours should override it.",
    merged: "Watch for cognitive dependency. Can you still do deep thinking without AI as a sounding board? The strongest position is 'merged by choice, independent by capability.'",
    complicated: "Your mixed signals are actually valuable data. The gap between your strong areas and weak areas tells you exactly what to work on. The fix isn't more AI — it's more deliberate AI.",
  };

  return {
    levelTips: levelTips[Math.min(level, 4)] || levelTips[4],
    relationshipTip: relationshipTips[relationshipStatus] || relationshipTips.casual,
  };
}

// ─── Keyword scorers ────────────────────────────────────
function scorePromptFix(text) {
  const t = text.toLowerCase();
  const l3Keywords = ["closing", "close rate", "diagnose", "weakness", "pipeline", "specific", "mindset", "strategy", "lost deals", "proposal stage", "real time"];
  const l2Keywords = ["experience", "years", "industry", "focus on", "improve my", "without", "freelancer", "enterprise", "beginner"];
  let l3Count = l3Keywords.filter(k => t.includes(k)).length;
  let l2Count = l2Keywords.filter(k => t.includes(k)).length;
  if (l3Count >= 2 || t.length > 120) return 3;
  if (l2Count >= 2 || t.length > 70) return 2;
  return 1;
}

function scoreFollowUp(text) {
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
}

// ─── UI Primitives ──────────────────────────────────────

function ProgressBar({ current, total = 6 }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full max-w-xs mx-auto mb-8">
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-center mt-2">
        <span className="text-gray-500 text-xs">{current + 1} of {total}</span>
      </div>
    </div>
  );
}

// ─── Enhanced FadeIn Component ──────────────────────────
function FadeIn({ children, delay = 0, direction = 'up', duration = 600, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';
    
    const animations = {
      up: 'animate-[slideInUp_0.6s_ease-out_forwards] opacity-100',
      right: 'animate-[slideInRight_0.6s_ease-out_forwards] opacity-100', 
      left: 'animate-[slideInLeft_0.6s_ease-out_forwards] opacity-100',
      fade: 'animate-[fadeIn_0.6s_ease-out_forwards] opacity-100',
      scale: 'animate-[scaleIn_0.6s_ease-out_forwards] opacity-100'
    };
    
    return animations[direction] || animations.up;
  };

  const getTransform = () => {
    if (isVisible) return '';
    
    switch(direction) {
      case 'up': return 'translate-y-8';
      case 'right': return 'translate-x-5';
      case 'left': return '-translate-x-5';
      case 'scale': return 'scale-95';
      default: return 'translate-y-8';
    }
  };

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-600 ease-out ${getTransform()} ${getAnimationClass()} ${className}`}
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
    <div className={`transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}

function ResultBadge({ correct, label }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
      correct
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
    }`}>
      <span className="text-lg">{correct ? "✦" : "✧"}</span>
      {label}
    </div>
  );
}

// ─── Landing ────────────────────────────────────────────
function Landing({ onStart }) {
  const [supportsGradient, setSupportsGradient] = useState(true);

  useEffect(() => {
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
    trackAnalyticsEvent('test_started');
    onStart();
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
        {/* Ambient glow with premium animation */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/6 rounded-full blur-3xl opacity-0 animate-[fadeInGlow_2s_ease-out_0.3s_forwards]" 
        />

        {/* Logo Bar at Top - Fade in first */}
        <FadeIn delay={200} direction="fade">
          <div className="w-full bg-gray-900/60 border-b border-gray-800/40 backdrop-blur-sm py-4 z-20 relative">
            <div className="flex items-center justify-center">
              {/* LearnTube Logo */}
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
                <div className="bg-gradient-to-br from-white via-blue-200 to-blue-600 bg-clip-text text-transparent">Find your</div>
              </FadeIn>
              <FadeIn delay={800} direction="up">
                <div className="bg-gradient-to-br from-white via-blue-200 to-blue-600 bg-clip-text text-transparent">AI Level</div>
              </FadeIn>
            </div>
            
            <FadeIn delay={1200} direction="up">
              <p className="text-gray-400 text-lg sm:text-xl mb-8 leading-normal">
                6 scenarios. 3 minutes.<br />
                A score most people don't expect.
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
              Benchmarked against AI proficiency standards from<br />
              <span className="text-gray-400 font-medium">BCG, Anthropic, and MIT Media Lab</span>
            </p>
            
            <button
              onClick={handleStart}
              className="group w-full bg-blue-500 hover:bg-blue-400 text-black font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/20 relative overflow-hidden opacity-0 animate-[scaleIn_0.8s_ease-out_1.8s_forwards]"
            >
              {/* Shine effect overlay - starts after button appears */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-0 animate-[fadeIn_0.5s_ease-out_2.5s_forwards]"
                style={{
                  background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                  animation: 'fadeIn 0.5s ease-out 2.5s forwards, shine 4s ease-in-out infinite 3s',
                  transform: 'translateX(-100%)',
                }}
              />
              
              <span className="flex items-center justify-center gap-3 relative z-10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                Take the AI Level Test
                <span className="inline-block transition-all duration-300 group-hover:translate-x-1">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="transition-transform duration-300 group-hover:scale-110"
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
              No credit card required. Instant results.
            </p>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 1: Spot the AI ────────────────────────────────
function Item1({ onAnswer }) {
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-4">
          <ProgressBar current={0} />
          
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <FadeIn delay={200} direction="fade">
            <div className="text-center mb-6">
              <p className="text-blue-400/50 text-xs font-medium mb-2">Let's start easy</p>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Spot the human.</h2>
              <p className="text-gray-500 text-sm">One was written by a person. One by AI. Just go with your gut.</p>
            </div>
          </FadeIn>
          
          <div className="grid gap-3 sm:gap-4">
            <FadeIn delay={400} direction="left">
              <button
                onClick={() => onAnswer("A")}
                className="group text-left p-4 sm:p-5 rounded-2xl border border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 transition-all duration-500 w-full hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="text-blue-400/60 text-xs font-semibold mb-2 tracking-widest transition-colors group-hover:text-blue-400/80">A</div>
                <p className="text-gray-300 leading-relaxed text-sm group-hover:text-white transition-colors duration-300">
                  Working from home kills focus. Set up in one spot, close every tab except what you need, and use a timer. Real work happens in blocks of uninterrupted time. Don't pretend you're being productive while scrolling. You're not.
                </p>
              </button>
            </FadeIn>
            
            <FadeIn delay={550} direction="right">
              <button
                onClick={() => onAnswer("B")}
                className="group text-left p-4 sm:p-5 rounded-2xl border border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 transition-all duration-500 w-full hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="text-blue-400/60 text-xs font-semibold mb-2 tracking-widest transition-colors group-hover:text-blue-400/80">B</div>
                <p className="text-gray-300 leading-relaxed text-sm group-hover:text-white transition-colors duration-300">
                  To maximize productivity while working from home, establish a dedicated workspace and implement time-blocking techniques. Minimize digital distractions by organizing your digital environment and utilizing focus tools. Consistent routines enhance concentration and output quality.
                </p>
              </button>
            </FadeIn>
          </div>
        </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item1Reveal({ correct, onContinue }) {
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "Sharp eye" : "Tricky one"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-2">
              {correct
                ? "You caught it. B plays it safe — every phrase balanced, no opinions taken. AI loves the middle ground."
                : "A sounds rougher, but that's the tell. Humans argue and take sides. AI hedges."}
            </p>
            <p className="text-gray-600 text-sm mb-8">
              {correct
                ? "Most people pick the polished one. You didn't."
                : "This is the most common mistake — and it matters more than you think."}
            </p>
            <button onClick={onContinue} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm">
              Next →
            </button>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 2: Calibration Probe ──────────────────────────
function Item2({ onAnswer }) {
  const [ratings, setRatings] = useState({});
  const continueButtonRef = useRef(null);
  
  const tasks = [
    { id: "email", text: "Write a professional email politely declining a job offer", icon: "✉" },
    { id: "finance", text: "Analyze your company's finances and decide where to cut costs", icon: "📊" },
    { id: "social", text: "Generate 10 social media post ideas for a coffee shop", icon: "☕" },
    { id: "mailbox", text: "Check your physical mailbox and tell you what packages arrived", icon: "📦" },
  ];
  const options = ["Nail it", "Be OK", "Fail"];
  const allAnswered = Object.keys(ratings).length === 4;

  // Auto-scroll when all answers are complete
  useEffect(() => {
    if (allAnswered && continueButtonRef.current) {
      setTimeout(() => {
        continueButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300); // Wait for FadeIn animation
    }
  }, [allAnswered]);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <ProgressBar current={1} />
        <FadeIn>
          <div className="max-w-lg text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">How good is AI, really?</h2>
            <p className="text-gray-500 text-sm">Rate each task. Would AI nail it, be OK, or fail?</p>
          </div>
        </FadeIn>
        <div className="max-w-lg w-full space-y-3">
          {tasks.map((task, i) => (
            <FadeIn key={task.id} delay={i * 100}>
              <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800/60">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-lg">{task.icon}</span>
                  <p className="text-gray-300 text-sm leading-relaxed">{task.text}</p>
                </div>
                <div className="flex gap-2 ml-8">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setRatings({ ...ratings, [task.id]: opt })}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                        ratings[task.id] === opt
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-gray-800/60 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        {allAnswered && (
          <FadeIn delay={200}>
            <button
              ref={continueButtonRef}
              onClick={() => onAnswer(ratings)}
              className="mt-8 bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              Continue →
            </button>
          </FadeIn>
        )}
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item2Reveal({ scores, onContinue }) {
  const correct = scores.item2Correct;
  const messages = {
    high: "You understand AI's boundary better than most. You know what to hand it and what to keep.",
    mid: "Solid intuition about AI's edges. A few blind spots, but you know the shape.",
    low: "You're optimistic about AI — but the confidence trap is real. AI is best at structure, not judgment.",
  };
  const msg = correct >= 3 ? messages.high : correct >= 2 ? messages.mid : messages.low;

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <div className="flex justify-center gap-1.5 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    i < correct
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-800/40 text-gray-700 border border-gray-800/60"
                  }`}
                >
                  {i < correct ? "✓" : "·"}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs mb-4 tracking-wide">{correct}/4 calibrated correctly</p>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">{msg}</p>
            <button onClick={onContinue} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm">
              Next →
            </button>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 3: Artifact Effect ────────────────────────────
function Item3({ onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const confidenceRef = useRef(null);
  const continueButtonRef = useRef(null);

  // Auto-scroll when user selects an option (A or B)
  useEffect(() => {
    if (selected && confidenceRef.current) {
      setTimeout(() => {
        confidenceRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 200); // Wait for FadeIn animation
    }
  }, [selected]);

  // Auto-scroll when user selects confidence level
  useEffect(() => {
    if (confidence && continueButtonRef.current) {
      setTimeout(() => {
        continueButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100); // Short delay since continue button appears immediately
    }
  }, [confidence]);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <ProgressBar current={2} />
        <FadeIn>
          <div className="max-w-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Which response is actually useful?</h2>
            <p className="text-gray-500 text-sm">Someone asked AI: "How should we improve team productivity?"</p>
          </div>
        </FadeIn>
        <div className="max-w-2xl w-full grid md:grid-cols-2 gap-4 mb-6">
          <FadeIn delay={200}>
            <button
              onClick={() => setSelected("A")}
              className={`text-left p-5 rounded-2xl border transition-all duration-300 w-full ${
                selected === "A" ? "border-blue-500/60 bg-blue-500/5 shadow-lg shadow-blue-500/5" : "border-gray-800/60 bg-gray-900/50 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="text-blue-400/60 text-xs font-semibold tracking-widest">A</div>
                {/* Visual "polished" indicator */}
                <div className="flex gap-0.5 ml-auto">
                  <div className="w-1 h-3 bg-gray-700 rounded-full" />
                  <div className="w-1 h-3 bg-gray-700 rounded-full" />
                  <div className="w-1 h-3 bg-gray-700 rounded-full" />
                </div>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                To boost team productivity, focus on three core pillars. <strong className="text-gray-200">First, optimize your workflow processes</strong> — streamline communication and reduce meeting overhead. <strong className="text-gray-200">Second, invest in the right tools</strong> — the tech stack matters more than most realize. <strong className="text-gray-200">Third, foster accountability.</strong> These levers create a multiplicative effect. Start by conducting a productivity audit.
              </p>
            </button>
          </FadeIn>
          <FadeIn delay={350}>
            <button
              onClick={() => setSelected("B")}
              className={`text-left p-5 rounded-2xl border transition-all duration-300 w-full ${
                selected === "B" ? "border-blue-500/60 bg-blue-500/5 shadow-lg shadow-blue-500/5" : "border-gray-800/60 bg-gray-900/50 hover:border-gray-700"
              }`}
            >
              <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest">B</div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Before you change anything, find where time actually goes. Most teams assume meetings kill productivity, but they'll cut meetings and nothing changes. The real leak is usually async work — Slack threads that should be decisions, emails that should be syncs. Watch what your best performer does differently. Most productivity gains come from stopping something, not adding to your stack.
              </p>
            </button>
          </FadeIn>
        </div>
        {selected && (
          <FadeIn delay={100}>
            <div ref={confidenceRef} className="max-w-md text-center">
              <p className="text-gray-600 text-xs mb-3">How confident are you?</p>
              <div className="flex gap-2 justify-center mb-4">
                {["Very sure", "Somewhat", "Guessing"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setConfidence(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      confidence === c
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gray-800/60 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {confidence && (
                <button
                  ref={continueButtonRef}
                  onClick={() => onAnswer(selected, confidence)}
                  className="bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                >
                  Continue →
                </button>
              )}
            </div>
          </FadeIn>
        )}
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item3Reveal({ correct, onContinue }) {
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "You see through polish" : "The Artifact Effect got you"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">
              {correct
                ? "Response A has structure. Bold headers. Professional tone. But it says nothing specific. Response B has a real diagnosis. You caught that."
                : "Response A looks like expertise — bold headers, structured pillars, clear recommendations. But strip the formatting and it says nothing specific. Response B actually diagnoses the problem."}
            </p>
            <div className={`rounded-xl p-4 border mb-8 text-left ${
              correct ? "bg-emerald-500/5 border-emerald-500/15" : "bg-amber-500/5 border-amber-500/15"
            }`}>
              <p className={`text-xs font-medium mb-1 ${correct ? "text-emerald-400/80" : "text-amber-400/80"}`}>
                {correct ? "Why this matters" : "This has a name"}
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {correct
                  ? "Most people default to the polished-looking response. Seeing through that is the single biggest skill gap between Level 2 and Level 3."
                  : "The Artifact Effect: when AI output looks professional, your brain shortcuts past 'is this actually saying something?' That shortcut is what keeps most people at Level 2."}
              </p>
            </div>
            <button onClick={onContinue} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm">
              Next →
            </button>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 4: Conversation Fork ──────────────────────────
function Item4({ onAnswer }) {
  const [selected, setSelected] = useState(null);

  const options = [
    { id: "A", text: "That's solid. Use the structure and start drafting your slides." },
    { id: "B", text: "Ask AI to expand the \"lessons learned\" section, make it more executive-focused, and add bullet points." },
    { id: "C", text: "Tell AI: \"This doesn't explain how we decided what to cut. The VP needs to see we were strategic, not reactive. Restructure around the deprioritization logic.\"" },
    { id: "D", text: "Scrap the timeline approach. Ask AI to map business outcomes your project enabled — you'll build the narrative from there." },
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <ProgressBar current={3} />
        <FadeIn>
          <div className="max-w-lg text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">What's your next move?</h2>
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div className="max-w-lg w-full bg-gray-900/50 rounded-2xl p-5 mb-6 border border-gray-800/60">
            <p className="text-gray-500 text-xs mb-3">You're prepping for a quarterly review with your VP. You asked AI to structure a 10-min summary. Your team shipped on time, but resource constraints forced deprioritizing some features. AI gave you:</p>
            <div className="bg-gray-800/50 rounded-xl p-4 border-l-2 border-blue-500/50">
              <p className="text-gray-400 text-xs leading-relaxed italic">
                "Start with an executive summary: what you shipped and when. Walk through the timeline and challenges. Mention the resource constraints. End with lessons learned. Use concrete numbers where possible."
              </p>
            </div>
          </div>
        </FadeIn>
        <div className="max-w-lg w-full space-y-2.5">
          {options.map((opt, i) => (
            <FadeIn key={opt.id} delay={200 + i * 80}>
              <button
                onClick={() => setSelected(opt.id)}
                className={`text-left w-full p-4 rounded-2xl border transition-all duration-200 ${
                  selected === opt.id
                    ? "border-blue-500/60 bg-blue-500/5 shadow-lg shadow-blue-500/5"
                    : "border-gray-800/60 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50"
                }`}
              >
                <span className="text-blue-400/50 text-xs font-semibold mr-2">{opt.id}.</span>
                <span className="text-gray-300 text-sm">{opt.text}</span>
              </button>
            </FadeIn>
          ))}
        </div>
        {selected && (
          <FadeIn delay={100}>
            <button
              onClick={() => onAnswer(selected)}
              className="mt-8 bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              Continue →
            </button>
          </FadeIn>
        )}
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item4Reveal({ choice, onContinue }) {
  const data = {
    A: { quality: "low", text: "You're getting value from AI, but you're not leveraging the collaboration — the ability to push back and co-author the thinking.", insight: "Accepting the first draft means you're using AI as a search engine, not a thinking partner." },
    B: { quality: "mid", text: "You're treating it as a first draft, which is good. But you're polishing the container, not the content. The structure still doesn't answer what the VP actually wants to know.", insight: "Iterating on format feels productive. Iterating on reasoning IS productive." },
    C: { quality: "high", text: "You spotted the gap between generic best practice and what your specific audience needs. That's the difference between using AI to fill a template and using AI to think.", insight: "The VP doesn't need a timeline. They need proof of strategic judgment. You caught that." },
    D: { quality: "high", text: "You rejected AI's frame for your own. That's strong judgment — as long as it's strategic, not avoidant.", insight: "Reframing the problem is the highest-leverage AI skill. Most people never try it." },
  };
  const d = data[choice];
  const isHigh = d.quality === "high";

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge
              correct={isHigh}
              label={isHigh ? "Strong judgment" : d.quality === "mid" ? "Getting there" : "Room to grow"}
            />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">{d.text}</p>
            <p className="text-gray-600 text-sm italic mb-8">{d.insight}</p>
            <button onClick={onContinue} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm">
              Next →
            </button>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 5a: Restraint Check ───────────────────────────
function Item5a({ onAnswer }) {
  const [a1, setA1] = useState(null);
  const [a2, setA2] = useState(null);

  const scenarios = [
    {
      text: "You hurt a friend's feelings and want to send them an apology.",
      subtext: "You ask ChatGPT to draft it.",
      key: "apology",
      icon: "💬",
    },
    {
      text: "Your partner has a newly discovered shellfish allergy.",
      subtext: "You ask ChatGPT for shellfish-free recipes for the week.",
      key: "allergy",
      icon: "🍽",
    },
  ];

  const answers = { apology: a1, allergy: a2 };
  const setters = { apology: setA1, allergy: setA2 };
  const allDone = a1 !== null && a2 !== null;

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <ProgressBar current={4} />
        <FadeIn>
          <div className="max-w-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Would you use AI here?</h2>
            <p className="text-gray-500 text-sm">The hardest AI skill: knowing when not to.</p>
          </div>
        </FadeIn>
        <div className="max-w-lg w-full space-y-4">
          {scenarios.map((s, i) => (
            <FadeIn key={s.key} delay={i * 150}>
              <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/60">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{s.text}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.subtext}</p>
                  </div>
                </div>
                <div className="flex gap-3 ml-9">
                  <button
                    onClick={() => setters[s.key](true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      answers[s.key] === true
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gray-800/60 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    Yes, use AI
                  </button>
                  <button
                    onClick={() => setters[s.key](false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      answers[s.key] === false
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gray-800/60 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    Skip AI
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        {allDone && (
          <FadeIn delay={200}>
            <button
              onClick={() => onAnswer(a1, a2)}
              className="mt-8 bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              Continue →
            </button>
          </FadeIn>
        )}
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item5aReveal({ apology, allergy, onContinue }) {
  const apologyCorrect = apology === false;
  const allergyCorrect = allergy === false;
  const both = apologyCorrect && allergyCorrect;

  let msg, subMsg;
  if (both) {
    msg = "You knew when to step away from AI. That's one of the most underrated skills — and one most assessments never test.";
    subMsg = "Apologies need your voice. Allergy recipes need verified safety. You got both.";
  } else if (!apologyCorrect && !allergyCorrect) {
    msg = "AI is tempting for everything. But apologies need your real voice, and allergies need verified safety.";
    subMsg = "AI's confident mistakes are annoying in a document. They're dangerous in a recipe.";
  } else if (!apologyCorrect) {
    msg = "The allergy call was smart. But apologies aren't information problems — they're trust problems.";
    subMsg = "AI can't rebuild trust because it wasn't there to break it.";
  } else {
    msg = "Good instinct on the apology. But when the wrong answer has physical consequences, confident AI guessing becomes dangerous.";
    subMsg = "AI doesn't know what it doesn't know about your partner's safety.";
  }

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={both} label={both ? "Restraint is a skill" : "Worth thinking about"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-2">{msg}</p>
            <p className="text-gray-600 text-sm italic mb-8">{subMsg}</p>
            <button onClick={onContinue} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm">
              Next →
            </button>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 5b: Prompt Autopsy ────────────────────────────
function Item5b({ onAnswer }) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (text.length <= 10) return;
    setIsSubmitting(true);
    await onAnswer(text);
    setIsSubmitting(false);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <FadeIn>
          <div className="max-w-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Fix this prompt.</h2>
            <p className="text-gray-500 text-sm">Someone typed this into ChatGPT. The response was useless. Why?</p>
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="max-w-lg w-full mb-6">
            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800/60 mb-3">
              <p className="text-gray-600 text-xs mb-2 font-medium">The prompt</p>
              <p className="text-gray-300 text-sm font-mono bg-gray-800/40 rounded-xl px-4 py-3">"what are some ways to get better at sales"</p>
            </div>
            <div className="bg-gray-900/30 rounded-2xl p-5 border border-gray-800/40">
              <p className="text-gray-600 text-xs mb-2 font-medium">ChatGPT said</p>
              <p className="text-gray-500 text-sm italic leading-relaxed">
                "Here are some ways to improve: 1. Practice active listening 2. Build rapport 3. Understand customer needs 4. Learn objection handling 5. Study successful salespeople. Keep practicing!"
              </p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <div className="max-w-lg w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Rewrite this prompt so ChatGPT gives a useful answer.</p>
              <span className="text-amber-400/60 text-[10px] font-medium bg-amber-400/10 px-2 py-0.5 rounded-full">This one counts</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`e.g. "I'm a B2B SaaS account exec, 2 years in. My close rate dropped from 22% to 14% this quarter. Help me diagnose what's going wrong..."`}
              rows={3}
              className="w-full bg-gray-900/50 border border-gray-800/60 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-700 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-700 text-xs">{text.length > 0 ? `${text.length} chars` : "A sentence or two is enough"}</span>
              {text.length > 10 && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`font-semibold px-6 py-2.5 rounded-2xl text-sm transition-all duration-300 ${
                    isSubmitting
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97]"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    "Continue →"
                  )}
                </button>
              )}
            </div>
          </div>
        </FadeIn>
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item5bReveal({ level, onContinue }) {
  const msgs = {
    1: { text: "That's still treating ChatGPT like Google — type a question, get a generic answer.", sub: "The magic starts when you tell it who you are and what you're actually stuck on." },
    2: { text: "Now the AI has context. It knows what to ignore and what to dig into.", sub: "That's the difference between a generic answer and a useful one." },
    3: { text: "You're using AI as a thinking partner, not a fact machine.", sub: "That shift is where most people never get to." },
  };
  const m = msgs[level] || msgs[1];
  const bars = [
    { label: "Basic", active: level >= 1 },
    { label: "Contextual", active: level >= 2 },
    { label: "Strategic", active: level >= 3 },
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <p className="text-gray-600 text-xs font-medium tracking-widest uppercase mb-4">Your prompt quality</p>
            <div className="flex gap-1.5 justify-center mb-2">
              {bars.map((b, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    b.active ? "bg-blue-500 w-20" : "bg-gray-800 w-16"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between max-w-[240px] mx-auto mb-8">
              {bars.map((b, i) => (
                <span key={i} className={`text-xs ${b.active ? "text-blue-400" : "text-gray-700"}`}>{b.label}</span>
              ))}
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-2">{m.text}</p>
            <p className="text-gray-600 text-sm italic mb-8">{m.sub}</p>
            <button onClick={onContinue} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm">
              Almost done →
            </button>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 6: What Would You Ask? ────────────────────────
function Item6({ onAnswer }) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (text.length <= 10) return;
    setIsSubmitting(true);
    await onAnswer(text);
    setIsSubmitting(false);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <ProgressBar current={5} />
        <FadeIn>
          <div className="max-w-lg text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">Last one. Then you'll see your results.</h2>
            <p className="text-gray-500 text-sm">You asked AI to analyze why your team's project fell behind. It said:</p>
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="max-w-lg w-full bg-gray-900/50 rounded-2xl p-5 border border-gray-800/60 mb-6">
            <p className="text-gray-400 text-sm leading-relaxed">
              Your sprint underperformance likely stems from three factors: scope creep, resource constraints (two members on leave), and estimation gaps. To improve: lock requirements before sprint start, build buffer for absences, and run estimation retros. These changes should help you hit 90%+ completion next quarter.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <div className="max-w-lg w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">What's the ONE follow-up question you'd ask?</p>
              <span className="text-blue-400/60 text-[10px] font-medium bg-blue-400/10 px-2 py-0.5 rounded-full">Separates L2 from L3</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="The obvious move is asking for more detail. The interesting move is challenging the analysis itself..."
              rows={2}
              className="w-full bg-gray-900/50 border border-gray-800/60 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-700 resize-none"
              disabled={isSubmitting}
            />
            {text.length > 10 && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`font-semibold px-6 py-2.5 rounded-2xl text-sm transition-all duration-300 ${
                    isSubmitting
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97]"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    "See my results →"
                  )}
                </button>
              </div>
            )}
          </div>
        </FadeIn>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Loading Screen ─────────────────────────────────────
function LoadingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0); // 0=analyzing, 1=teaser, 2=done

  const labels = [
    "Reading your patterns",
    "Scoring your judgment", 
    "Detecting your AI relationship",
    "Building your profile",
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => setStep(3), 2300);
    const t4 = setTimeout(() => setPhase(1), 3200);
    const t5 = setTimeout(() => onDone(), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onDone]);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Animated background glow with multiple layers */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-out ${
            phase >= 1 ? "bg-blue-500/8 scale-200 blur-3xl" : "bg-blue-500/4 scale-100 blur-2xl"
          }`} />
          <div className={`absolute w-64 h-64 rounded-full transition-all duration-[2500ms] ease-out delay-300 ${
            phase >= 1 ? "bg-emerald-500/6 scale-150 blur-2xl" : "bg-emerald-500/3 scale-90 blur-xl"
          }`} />
          <div className={`absolute w-32 h-32 rounded-full transition-all duration-[2000ms] ease-out delay-500 ${
            phase >= 1 ? "bg-white/4 scale-125 blur-xl" : "bg-white/2 scale-80 blur-lg"
          }`} />
        </div>

        {/* Particle effect overlay */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse`}
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
          <div className={`transition-all duration-1000 ease-out ${
            phase === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 scale-95"
          }`}>
            {labels.map((label, i) => (
              <FadeIn key={i} delay={i * 300 + 200} direction="up">
                <div
                  className={`transition-all duration-700 ease-out mb-6 ${
                    i <= step ? "opacity-100 translate-y-0 scale-100" : "opacity-30 translate-y-2 scale-95"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-lg transition-all duration-500 ${
                      i < step ? "text-blue-400 scale-110" : i === step ? "text-emerald-400 animate-pulse" : "text-gray-500"
                    }`}>
                      {i < step ? "✓" : i === step ? "◆" : "◦"}
                    </span>
                    <span className={`text-sm font-medium transition-all duration-500 ${
                      i < step ? "text-blue-300" : i === step ? "text-white" : "text-gray-400"
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

          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-out ${
            phase >= 1 ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"
          }`}>
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full mx-auto animate-spin" />
              </div>
              <p className="text-emerald-400 text-lg font-medium animate-pulse">Your results are ready.</p>
              <p className="text-gray-500 text-sm mt-2">Preparing your personalized insights...</p>
            </div>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Lead Capture (Partial Reveal Gate) ─────────────────
function LeadCapture({ level, scores, relationshipStatus, onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [stage, setStage] = useState(0);
  const data = LEVEL_DATA[level] || LEVEL_DATA[4];

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const canSubmit = name.trim().length >= 2 && phone.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    const leadData = { 
      name: name.trim(), 
      phone: `+91${phone.trim()}`, 
      email: email.trim() || null, 
      level, 
      relationshipStatus,
      scores,
      timestamp: Date.now() 
    };
    
    // Track lead capture event
    trackAnalyticsEvent('lead_captured', { level, name: name.trim() });
    
    // Capture to Supabase
    const result = await captureLeadData(leadData);
    
    // Store lead ID for intent tracking later
    if (result.success && result.data) {
      leadData.id = result.data.id;
    }
    
    onSubmit(leadData);
  };

  // Teaser content for locked cards — shows blurred real-looking content
  const lockedCards = [
    {
      icon: "🌀",
      label: "Your AI Relationship",
      tease: "You're ████ with AI",
      sub: "Most people at your level are surprised by this.",
      accentColor: "#a78bfa",
    },
    {
      icon: "⚡",
      label: "3 ways to level up",
      tease: "Your #1 gap: ████████",
      sub: "Personalized to your specific weak spots.",
      accentColor: "#34d399",
    },
    {
      icon: "🔍",
      label: "Strengths & blind spots",
      tease: "You're strong at ████ but ████",
      sub: "The pattern most people don't see in themselves.",
      accentColor: "#60a5fa",
    },
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-5 py-6 sm:py-8 relative overflow-auto">
        {/* Level-colored background glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[100px] opacity-[0.07] pointer-events-none"
          style={{ backgroundColor: data.color }}
        />

        <div className="max-w-sm w-full relative z-10">

          {/* ── Level number (the hook) — compact ── */}
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-gray-500 text-[10px] font-semibold tracking-[0.25em] uppercase mb-1">Your AI Level</p>
            <div className="text-4xl sm:text-5xl font-extrabold leading-none" style={{ color: data.color }}>
              {level >= 4 ? "4+" : level}
            </div>
          </div>

          {/* ── Locked preview cards (FOMO triggers) — compact rows ── */}
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

          {/* ── Form ── */}
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
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500 hover:bg-gray-800/80"
                    />
                  </FadeIn>
                  
                  <FadeIn delay={1250} direction="up">
                    <div className="flex items-center gap-0 bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all hover:bg-gray-800/80">
                      <span className="text-gray-400 text-sm pl-4 pr-1 py-2.5 select-none">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="WhatsApp number"
                        className="flex-1 bg-transparent py-2.5 pr-4 text-white text-sm focus:outline-none placeholder-gray-500"
                      />
                    </div>
                  </FadeIn>
                  
                  {showEmail ? (
                    <FadeIn delay={1400} direction="up">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500 hover:bg-gray-800/80"
                      />
                    </FadeIn>
                  ) : (
                    <FadeIn delay={1400} direction="fade">
                      <button
                        onClick={() => setShowEmail(true)}
                        className="text-gray-500 text-[11px] hover:text-gray-300 transition-colors w-full text-center py-0.5 hover:scale-105 transform transition-transform duration-200"
                      >
                        + Add email too
                      </button>
                    </FadeIn>
                  )}
                </div>

                <FadeIn delay={1550} direction="scale">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 min-h-[48px] ${
                      canSubmit
                        ? "bg-white text-gray-950 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10 hover:shadow-white/20"
                        : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {canSubmit ? "Unlock my results →" : "Unlock my results"}
                  </button>
                </FadeIn>
              </div>
            </FadeIn>
          </div>

          {/* ── Trust line ── */}
          <div className={`transition-all duration-500 ${stage >= 3 ? "opacity-100" : "opacity-0"}`}>
            <p className="text-gray-700 text-[10px] text-center mt-3">No spam · Instant delivery · Unsubscribe anytime</p>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Share Card Canvas Renderer ─────────────────────────
function renderShareCard(canvas, level, levelData, relationshipData, percentile) {
  const ctx = canvas.getContext("2d");
  const w = 1080, h = 1080;
  canvas.width = w;
  canvas.height = h;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#07070f");
  grad.addColorStop(0.4, "#0c1024");
  grad.addColorStop(1, "#07070f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  ctx.strokeStyle = "rgba(59, 130, 246, 0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
  }

  // Glow
  const glowGrad = ctx.createRadialGradient(w / 2, 320, 0, w / 2, 320, 250);
  glowGrad.addColorStop(0, levelData.color + "22");
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 100, w, 500);

  // Top label
  ctx.fillStyle = "#60a5fa";
  ctx.font = "600 16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MY AI LEVEL", w / 2, 160);

  // Level number
  ctx.fillStyle = levelData.color;
  ctx.font = "800 200px system-ui, -apple-system, sans-serif";
  ctx.fillText(level >= 4 ? "4+" : String(level), w / 2, 400);

  // Level name + tier
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 40px system-ui, -apple-system, sans-serif";
  ctx.fillText(levelData.name, w / 2, 470);
  ctx.fillStyle = levelData.color + "aa";
  ctx.font = "500 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(levelData.tier, w / 2, 502);

  // Tagline (word-wrapped)
  ctx.fillStyle = "#94a3b8";
  ctx.font = "italic 400 20px system-ui, -apple-system, sans-serif";
  const words = levelData.tagline.split(" ");
  let line = "", y = 550;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > w - 200) {
      ctx.fillText(line.trim(), w / 2, y);
      line = word + " ";
      y += 30;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), w / 2, y);

  // Divider
  y += 50;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.moveTo(w / 2 - 120, y);
  ctx.lineTo(w / 2 + 120, y);
  ctx.stroke();

  // Relationship status
  y += 45;
  ctx.fillStyle = relationshipData.color;
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("AI RELATIONSHIP STATUS", w / 2, y);
  y += 40;
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${relationshipData.emoji}  ${relationshipData.status}`, w / 2, y);
  y += 30;
  ctx.fillStyle = "#64748b";
  ctx.font = "400 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(relationshipData.tagline, w / 2, y);

  // Percentile
  y += 60;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.roundRect(w / 2 - 130, y - 18, 260, 36, 18);
  ctx.fill();
  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Top ${percentile}% of test-takers`, w / 2, y + 5);

  // Branding
  ctx.fillStyle = "#60a5fa";
  ctx.font = "700 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("LearnTube.ai", w / 2 - 50, h - 55);
  ctx.fillStyle = "#475569";
  ctx.font = "400 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("|  AI Level Assessment", w / 2 + 30, h - 55);
  ctx.fillStyle = "#475569";
  ctx.font = "400 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("What's yours? → ai-level.learntube.ai", w / 2, h - 32);
}

// ─── Level Reveal ───────────────────────────────────────
function AnimatedNumber({ target, color, duration = 1200 }) {
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const display = target >= 4 ? "4+" : String(target);

  useEffect(() => {
    if (target === 0) { setDone(true); return; }
    const steps = Math.min(target, 4);
    const interval = duration / steps;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setCurrent(i);
      if (i >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setDone(true);
          setTimeout(() => setShowGlow(true), 200);
        }, 100);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Perfect circular background glow */}
      {done && showGlow && (
        <>
          <div
            className="absolute w-32 h-32 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute w-40 h-40 rounded-full blur-xl opacity-10 animate-pulse delay-100"
            style={{ backgroundColor: color }}
          />
        </>
      )}
      
      {/* Perfect circular border ring */}
      {done && (
        <div 
          className="absolute w-36 h-36 border-2 rounded-full opacity-0 animate-[scaleIn_1s_ease-out_0.5s_forwards] pointer-events-none"
          style={{ borderColor: `${color}40` }}
        />
      )}
      
      <span
        className={`text-8xl font-extrabold transition-all duration-500 relative z-10 ${
          done 
            ? "scale-100 drop-shadow-2xl" 
            : "scale-110 animate-pulse"
        }`}
        style={{ 
          color,
          filter: showGlow ? `drop-shadow(0 0 20px ${color}40)` : 'none',
          textShadow: showGlow ? `0 0 30px ${color}60` : 'none'
        }}
      >
        {done ? display : current}
      </span>
      
      {/* Sparkle effects positioned around the circle */}
      {done && showGlow && (
        <>
          <div className="absolute top-2 right-8 w-3 h-3 bg-white rounded-full opacity-60 animate-ping delay-500" />
          <div className="absolute bottom-4 left-6 w-2 h-2 bg-white rounded-full opacity-40 animate-ping delay-700" />
          <div className="absolute top-8 left-4 w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-ping delay-900" />
        </>
      )}
    </div>
  );
}

// ─── Expandable Section ──────────────────────────────────
function Expandable({ label, color, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full">
      <button onClick={() => setOpen(!open)} className="w-full text-left py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium" style={{ color: color || "#94a3b8" }}>{label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 text-gray-600 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        open 
          ? "max-h-screen opacity-100 pb-3" 
          : "max-h-0 opacity-0 pb-0"
      }`}>
        <div className={`${open ? "" : "hidden"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── All Levels Scale ────────────────────────────────────
const LEVEL_SCALE = [
  { level: 0, name: "Non-User", short: "Haven't started", tier: "Explorer" },
  { level: 1, name: "Experimenter", short: "Dabbling", tier: "Explorer" },
  { level: 2, name: "Functional User", short: "Getting value", tier: "Practitioner" },
  { level: 3, name: "Effective Practitioner", short: "Real judgment", tier: "Operator" },
  { level: 4, name: "AI-Native Performer", short: "AI is how you work", tier: "Strategist" },
  { level: 5, name: "AI-Native Builder", short: "Builds AI systems", tier: "Architect" },
  { level: 6, name: "Frontier Contributor", short: "Advancing the field", tier: "Pioneer" },
];

// Two dimensions: Tier = how you treat AI, Status = your association pattern
const RELATIONSHIP_SCALE = [
  { key: "single", label: "Single", tierLabel: "Pre-Tool", short: "AI isn't part of your life yet" },
  { key: "casual", label: "Casual", tierLabel: "AI as Tool", short: "You pick it up and put it down" },
  { key: "committed", label: "Committed", tierLabel: "AI as Colleague", short: "Real working relationship" },
  { key: "merged", label: "Merged", tierLabel: "AI as Symbiont", short: "Thinking is intertwined" },
  { key: "complicated", label: "It's Complicated", tierLabel: "Mixed signals", short: "Strong in some areas, dependent in others" },
];

function LevelReveal({ level, scores, insights, relationshipStatus }) {
  const [stage, setStage] = useState(0);
  const [shareState, setShareState] = useState("idle"); // idle | sharing | shared | fallback
  const [proveReserved, setProveReserved] = useState(false);
  const [improveReserved, setImproveReserved] = useState(false);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const data = LEVEL_DATA[level] || LEVEL_DATA[4];
  const relData = RELATIONSHIP_DATA[relationshipStatus] || RELATIONSHIP_DATA.casual;
  const percentile = getPercentile(level);
  const suggestions = getImprovementSuggestions(level, relationshipStatus);

  useEffect(() => {
    // Track reveal viewed
    trackAnalyticsEvent('reveal_viewed', { level, relationshipStatus });

    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [level, relationshipStatus]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 1800);
    const t4 = setTimeout(() => setStage(4), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Render share card when share section appears
  useEffect(() => {
    if (stage >= 3 && previewRef.current) {
      renderShareCard(previewRef.current, level, data, relData, percentile);
    }
  }, [stage, level, data, relData, percentile]);

  const shareText = `I'm AI Level ${level >= 4 ? "4+" : level} — ${data.name} ${relData.emoji}\nMy AI Relationship Status: ${relData.status}\n\nTop ${percentile}% of test-takers.\nWhat's yours? → https://ai-level.learntube.ai?utm_source=user_share`;

  const handleShare = async () => {
    setShareState("sharing");
    
    // Track share initiated
    trackAnalyticsEvent('share_initiated', { level, relationshipStatus });
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderShareCard(canvas, level, data, relData, percentile);

    if (navigator.share && navigator.canShare) {
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        const file = new File([blob], `ai-level-${level}.png`, { type: "image/png" });
        const shareData = { text: shareText, files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareState("shared");
          trackAnalyticsEvent('share_completed', { method: 'native_files', level, relationshipStatus });
          setTimeout(() => setShareState("idle"), 3000);
          return;
        }
      } catch (e) {
        if (e.name === "AbortError") { 
          setShareState("idle");
          trackAnalyticsEvent('share_cancelled', { method: 'native_files', level, relationshipStatus });
          return; 
        }
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: "https://ai-level.learntube.ai?utm_source=user_share" });
        setShareState("shared");
        trackAnalyticsEvent('share_completed', { method: 'native_text', level, relationshipStatus });
        setTimeout(() => setShareState("idle"), 3000);
        return;
      } catch (e) {
        if (e.name === "AbortError") { 
          setShareState("idle");
          trackAnalyticsEvent('share_cancelled', { method: 'native_text', level, relationshipStatus });
          return; 
        }
      }
    }
    const link = document.createElement("a");
    link.download = `ai-level-${level >= 4 ? "4plus" : level}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
    setShareState("fallback");
    trackAnalyticsEvent('share_completed', { method: 'fallback_download', level, relationshipStatus });
    setTimeout(() => setShareState("idle"), 4000);
  };

  const shareLabel = {
    idle: "Share my AI Level",
    sharing: "Preparing...",
    shared: "Shared!",
    fallback: "Image saved + text copied!",
  }[shareState];

  const handleReserve = async (type) => {
    const lead = window.__aiLevelLead || {};
    if (type === "prove") setProveReserved(true);
    if (type === "improve") setImproveReserved(true);
    
    // Track product reservation
    trackAnalyticsEvent('product_reserved', { type, level, relationshipStatus });
    
    // Capture intent to Supabase (now uses upsert to prevent duplicates)
    const intentData = { 
      [type]: true, 
      level, 
      relationshipStatus, 
      timestamp: Date.now() 
    };
    
    await captureIntentData(intentData);
    
    // Store intent — keep for backward compatibility
    window.__aiLevelIntent = { ...(window.__aiLevelIntent || {}), [type]: true, lead, level, relationshipStatus, timestamp: Date.now() };
  };

  // One-liner hook insight for the hero — the most impactful thing
  const hookInsight = insights[0];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
        <canvas ref={canvasRef} style={{ display: "none" }} />
        
        <Header />

        {/* Enhanced background glow with multiple layers */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-[2000ms] ease-out pointer-events-none"
          style={{ 
            backgroundColor: data.color, 
            opacity: stage >= 1 ? 0.12 : 0,
            transform: `translateX(-50%) ${stage >= 1 ? 'scale(1.2)' : 'scale(0.8)'}`
          }}
        />
        {/* Secondary glow */}
        <div
          className="absolute top-30 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[80px] transition-all duration-[2500ms] ease-out delay-300 pointer-events-none"
          style={{ 
            backgroundColor: data.color, 
            opacity: stage >= 1 ? 0.08 : 0,
            transform: `translateX(-50%) ${stage >= 1 ? 'scale(1)' : 'scale(0.6)'}`
          }}
        />

        <div className="flex-1 flex flex-col items-center px-5 py-8 pb-32">
          <div className="max-w-sm w-full relative z-10">

            {/* ═══════════════════════════════════════════════════
                 ZONE 1: COMPRESSED HERO — fits in one mobile fold
               ═══════════════════════════════════════════════════ */}

            {/* Level number + name — with proper spacing */}
            <div className={`text-center transition-all duration-700 mt-4 ${stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
              <p className="text-gray-400 text-xs font-bold tracking-[0.2em] mb-8">YOUR AI LEVEL</p>
              <div className="py-4">
                {stage >= 1 && <AnimatedNumber target={level} color={data.color} />}
              </div>
            </div>

          <div className={`text-center transition-all duration-700 mt-10 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="text-xl font-bold text-white mb-1">{data.name}</div>
            <p className="text-gray-400 text-xs leading-relaxed mb-2 max-w-xs mx-auto">{data.tagline}</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xs font-semibold" style={{ color: data.color }}>{data.tier}</span>
              <span className="text-gray-700 text-xs">·</span>
              <span className="text-gray-400 text-xs">Top <span className="text-white font-semibold">{percentile}%</span></span>
            </div>

            {/* Relationship status — inline compact */}
            <div className="flex items-center justify-center gap-2 bg-gray-900/60 rounded-full px-4 py-2 mb-3 mx-auto" style={{ maxWidth: "fit-content" }}>
              <span className="text-lg">{relData.emoji}</span>
              <span className="text-white text-sm font-semibold">{relData.status}</span>
              <span className="text-gray-600 text-[10px]">·</span>
              <span className="text-[11px]" style={{ color: relData.color }}>
                {relData.tier === "Pet / Mixed" ? "Pet & Tool" : relData.tier === "Pre-Tool" ? "Pre-AI" : relData.tier}
              </span>
            </div>

            {/* Hook insight — one line to create curiosity */}
            <div className="bg-gray-900/40 rounded-xl px-4 py-2.5 border border-gray-800/30 mb-4 text-left">
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: data.color }}>{hookInsight.label}</p>
              <p className="text-gray-300 text-xs leading-relaxed">{hookInsight.text}</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
               ZONE 2: PRODUCT CARDS — "Prove it" & "Improve it"
               Psychology: scarcity, curiosity, FOMO, loss aversion
             ═══════════════════════════════════════════════════ */}

          <div className={`transition-all duration-700 ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

            {/* Prove It card */}
            <div className="rounded-2xl border overflow-hidden mb-3" style={{ borderColor: `${data.color}30`, background: `linear-gradient(135deg, ${data.color}08, ${data.color}03)` }}>
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🏆</span>
                      <span className="text-white text-sm font-bold">Prove your level</span>
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Full 25-min assessment across all 8 abilities.{" "}
                      <span className="text-white font-medium">Get a certified AI Level score</span> you can add to LinkedIn.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-[10px] font-semibold">Early access — limited spots</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleReserve("prove")}
                disabled={proveReserved}
                className={`w-full py-3 text-sm font-semibold transition-all duration-300 ${
                  proveReserved
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-white hover:brightness-110 active:scale-[0.98]"
                }`}
                style={!proveReserved ? { backgroundColor: `${data.color}25`, color: data.color } : {}}
              >
                {proveReserved ? "✓ You're on the list" : "Reserve my spot →"}
              </button>
            </div>

            {/* Improve It card */}
            <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: "#10b98130", background: "linear-gradient(135deg, #10b98108, #10b98103)" }}>
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🚀</span>
                      <span className="text-white text-sm font-bold">Level up with a learning path</span>
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Personalized for your gaps. Go from L{level} to L{Math.min(level + 2, 6)} with{" "}
                      <span className="text-white font-medium">guided exercises + certification</span>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-semibold">Launching soon — first 100 get priority</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleReserve("improve")}
                disabled={improveReserved}
                className={`w-full py-3 text-sm font-semibold transition-all duration-300 ${
                  improveReserved
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:scale-[0.98]"
                }`}
              >
                {improveReserved ? "✓ You're on the list" : "Reserve my spot →"}
              </button>
            </div>

            {/* ═══════════════════════════════════════════════════
                 ZONE 3: SHARE CTA — with compact card preview
               ═══════════════════════════════════════════════════ */}

            <div className="flex items-center gap-3 mb-5">
              <div className="bg-gray-900/40 rounded-xl p-2 border border-gray-800/30 flex-shrink-0">
                <canvas
                  ref={previewRef}
                  className="rounded-lg"
                  style={{ width: 80, height: 80 }}
                />
              </div>
              <div className="flex-1">
                <button
                  onClick={handleShare}
                  disabled={shareState === "sharing"}
                  className={`w-full font-semibold py-3 rounded-xl text-sm transition-all duration-300 mb-1.5 ${
                    shareState === "shared" || shareState === "fallback"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-950 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
                  }`}
                >
                  {shareLabel}
                </button>
                <p className="text-gray-600 text-[9px] text-center">Challenge your friends — WhatsApp, LinkedIn, IG</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
               ZONE 4: LAYERED DEPTH — for those who scroll
               Everything below is expandable / optional
             ═══════════════════════════════════════════════════ */}

          <div className={`transition-all duration-700 ${stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-800/40" />
              <span className="text-gray-600 text-[9px] tracking-widest uppercase">Your full breakdown</span>
              <div className="flex-1 h-px bg-gray-800/40" />
            </div>

            {/* Expandable sections container - fixed mobile spacing */}
            <div className="space-y-2">
              {/* All insights */}
              <Expandable label={`Your profile insights (${insights.length})`} color={data.color}>
                <div className="space-y-2 text-left">
                  {insights.map((insight, i) => (
                    <div key={i} className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-800/30">
                      <p className="text-xs font-semibold mb-0.5" style={{ color: data.color }}>{insight.label}</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </Expandable>

              {/* How to level up */}
              <Expandable label="How to level up" color="#34d399">
                <div className="text-left space-y-2.5 mb-2">
                  {suggestions.levelTips.map((tip, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="text-emerald-400/50 text-sm mt-0.5 flex-shrink-0">→</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-800/30 pt-2.5">
                  <div className="flex gap-2.5">
                    <span className="text-sm mt-0.5 flex-shrink-0 opacity-60">{relData.emoji}</span>
                    <p className="text-gray-400 text-sm leading-relaxed italic">{suggestions.relationshipTip}</p>
                  </div>
                </div>
              </Expandable>

              {/* Level scale */}
              <Expandable label="See all 7 levels" color={data.color}>
                <div className="space-y-0.5">
                  {LEVEL_SCALE.map((l) => (
                    <div key={l.level} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left ${l.level === level ? "bg-gray-800/60" : ""}`}>
                      <span className={`text-xs font-bold w-4 text-right ${l.level === level ? "text-white" : "text-gray-700"}`}>{l.level}</span>
                      <span className={`text-[11px] flex-1 ${l.level === level ? "text-white font-medium" : "text-gray-600"}`}>{l.name}</span>
                      <span className={`text-[9px] ${l.level === level ? "text-gray-400" : "text-gray-700"}`}>{l.short}</span>
                      {l.level === level && <span className="text-[9px] ml-0.5" style={{ color: data.color }}>← You</span>}
                    </div>
                  ))}
                  <p className="text-gray-700 text-[9px] px-3 pt-2 italic">Levels 5-6 require the full assessment (coming soon).</p>
                </div>
              </Expandable>

              {/* Relationship types */}
              <Expandable label="What are the relationship types?" color={relData.color}>
                <div className="space-y-0.5 mt-1">
                  {RELATIONSHIP_SCALE.map((r) => (
                    <div key={r.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left ${r.key === relationshipStatus ? "bg-gray-800/60" : ""}`}>
                      <span className="text-sm w-5 flex-shrink-0">{RELATIONSHIP_DATA[r.key].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] ${r.key === relationshipStatus ? "text-white font-medium" : "text-gray-500"}`}>{r.label}</span>
                          <span className="text-gray-700 text-[9px]">·</span>
                          <span className={`text-[9px] ${r.key === relationshipStatus ? "" : "text-gray-600"}`} style={r.key === relationshipStatus ? { color: relData.color } : {}}>{r.tierLabel}</span>
                        </div>
                        <p className={`text-[9px] ${r.key === relationshipStatus ? "text-gray-400" : "text-gray-700"}`}>{r.short}</p>
                      </div>
                      {r.key === relationshipStatus && <span className="text-[9px] flex-shrink-0" style={{ color: relData.color }}>← You</span>}
                    </div>
                  ))}
                </div>
                <p className="text-gray-700 text-[9px] px-3 pt-2 italic">Your status combines how you treat AI (Tool, Colleague, Symbiont) with your engagement pattern (Casual, Committed, etc.).</p>
              </Expandable>
            </div>

            {/* LearnTube footer */}
            <div className="pt-5 mt-4 border-t border-gray-800/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="text-blue-400 text-[10px] font-bold tracking-wider">LearnTube.ai</span>
                <span className="text-gray-700 text-[10px]">|</span>
                <img src="/backed-by-google.png" alt="Backed by Google" className="h-5 opacity-70" />
              </div>
              <p className="text-gray-700 text-[10px] leading-relaxed max-w-xs mx-auto">
                AI Level & AI Relationship Status — LearnTube frameworks built on research from BCG, Anthropic & MIT Media Lab.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Generate Insights ──────────────────────────────────
function generateInsights(scores, level) {
  const ins = [];

  if (scores.item3Correct) {
    ins.push({ label: "Your evaluation instinct", text: "You saw through the Artifact Effect when most people don't. You judge output by substance, not polish." });
  } else if (scores.item2Correct >= 3) {
    ins.push({ label: "Your calibration", text: "You know AI's boundary — where it shines and where it breaks. That's rarer than it sounds." });
  } else {
    ins.push({ label: "Your starting point", text: "You're early in understanding what AI can and can't do. That's normal — and the fastest skill to build." });
  }

  if (!scores.item3Correct) {
    ins.push({ label: "Your biggest gap", text: "You chose polish over substance. The Artifact Effect — trusting AI output because it looks professional — is the #1 thing keeping people at Level 2." });
  } else if (scores.item4Choice === "B" || scores.item4Choice === "A") {
    ins.push({ label: "Your iteration pattern", text: "When AI's output was 80% there, you focused on format instead of substance. The question isn't 'how does this look?' — it's 'is the reasoning right?'" });
  } else if (scores.restraintScore < 2) {
    ins.push({ label: "Your delegation gap", text: "You're tempted to use AI everywhere. But knowing when NOT to use it is just as important as knowing when to." });
  } else {
    ins.push({ label: "Your edge", text: "No major gaps in the quick assessment. The detailed breakdown would reveal the subtler patterns." });
  }

  const bridges = {
    0: "Start by trying AI for one writing task this week. Just one. See what happens.",
    1: "Try giving ChatGPT more context — who you are, what you need, and what good looks like. That's the bridge.",
    2: "When AI gives you something that looks good, ask: 'Is this actually saying something specific?' That question changes everything.",
    3: "You have the judgment. Now build it into a system — workflows where AI handles the right steps and you handle the rest.",
    4: "You're at the frontier. The next step is building systems that uplift others — and pushing the boundary of what's possible.",
    5: "You build systems that make others better. The next step is advancing the practice itself.",
    6: "You're at the frontier. The practice evolves because people like you refuse to accept the current ceiling.",
  };
  ins.push({ label: level < 6 ? "The bridge to next level" : "What's next", text: bridges[Math.min(level, 6)] });

  return ins;
}

// ─── Main App ───────────────────────────────────────────
function AILevel() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [scores, setScores] = useState({
    a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, b1: 0,
    item3Correct: false, item4Choice: null, item6Level: 1,
    item2Correct: 0, restraintScore: 0,
    apologyAnswer: null, allergyAnswer: null, promptLevel: 1,
  });
  const scoresRef = useRef(scores);
  scoresRef.current = scores;

  // Initialize UTM tracking on component mount
  useEffect(() => {
    utmTracker.initialize();
  }, []);

  const update = (patch) => {
    setScores((prev) => {
      const next = { ...prev, ...patch };
      scoresRef.current = next;
      console.log(`\n📊 SCORE UPDATE:`, patch);
      console.log(`📈 CURRENT TOTALS:`, {
        a1: next.a1, a2: next.a2, a3: next.a3, a4: next.a4, a5: next.a5,
        b1: next.b1, item2Correct: next.item2Correct, 
        item3Correct: next.item3Correct, item4Choice: next.item4Choice, 
        item6Level: next.item6Level, restraintScore: next.restraintScore
      });
      return next;
    });
  };

  const handleItem1 = (choice) => {
    const correct = choice === "A";
    update({ a3: scores.a3 + (correct ? 1 : 0) });
    trackAnalyticsEvent('item_completed', { item: 1, choice, correct });
    setScreen(SCREENS.ITEM1_REVEAL);
  };

  const handleItem2 = (ratings) => {
    let correct = 0;
    if (ratings.email === "Nail it") correct++;
    if (ratings.finance === "Fail") correct++;
    if (ratings.social === "Be OK") correct++;
    if (ratings.mailbox === "Fail") correct++;
    const a1Score = correct >= 3 ? 3 : correct >= 2 ? 2 : correct >= 1 ? 1 : 0;
    const b1Adj = ratings.finance !== "Fail" ? -1 : 0;
    update({ a1: a1Score, b1: scores.b1 + b1Adj, item2Correct: correct });
    trackAnalyticsEvent('item_completed', { item: 2, ratings, correct });
    setScreen(SCREENS.ITEM2_REVEAL);
  };

  const handleItem3 = (choice, confidence) => {
    const correct = choice === "B";
    let a3Add = 0;
    let b1Add = 0;
    if (correct && confidence === "Very sure") { a3Add = 4; b1Add = 2; }
    else if (correct && confidence === "Somewhat") { a3Add = 3; b1Add = 1; }
    else if (correct) { a3Add = 1; }
    else if (!correct && confidence === "Very sure") { b1Add = -1; }
    update({ a3: scores.a3 + a3Add, b1: scores.b1 + b1Add, item3Correct: correct });
    trackAnalyticsEvent('item_completed', { item: 3, choice, confidence, correct });
    setScreen(SCREENS.ITEM3_REVEAL);
  };

  const handleItem4 = (choice) => {
    const scoreMap = { A: 1, B: 2, C: 4, D: 4 };
    update({ a4: scoreMap[choice], item4Choice: choice });
    trackAnalyticsEvent('item_completed', { item: 4, choice });
    setScreen(SCREENS.ITEM4_REVEAL);
  };

  const handleItem5a = (apology, allergy) => {
    const restraint = (!apology ? 1 : 0) + (!allergy ? 1 : 0);
    update({ a1: scores.a1 + restraint, restraintScore: restraint, apologyAnswer: apology, allergyAnswer: allergy });
    trackAnalyticsEvent('item_completed', { item: '5a', apology, allergy, restraintScore: restraint });
    setScreen(SCREENS.ITEM5A_REVEAL);
  };

  const handleItem5b = async (text) => {
    // Try LLM scoring first, fallback to keyword scoring
    const llmResult = await scoreLLMResponse('5b', text);
    
    let level;
    if (llmResult.useFallback) {
      // Keyword-based fallback scoring
      level = scorePromptFix(text);
      console.log('🔄 Using keyword scoring for Item 5B:', level);
    } else {
      level = llmResult.score;
      console.log('🤖 Using LLM scoring for Item 5B:', level, llmResult.reasoning);
    }
    
    update({ a2: level, promptLevel: level });
    trackAnalyticsEvent('item_completed', { 
      item: '5b', 
      promptLevel: level, 
      textLength: text.length,
      scoringMethod: llmResult.useFallback ? 'keyword' : 'llm'
    });
    setScreen(SCREENS.ITEM5B_REVEAL);
  };

  const handleItem6 = async (text) => {
    // Try LLM scoring first, fallback to keyword scoring  
    const llmResult = await scoreLLMResponse('6', text);
    
    let level;
    if (llmResult.useFallback) {
      // Keyword-based fallback scoring
      level = scoreFollowUp(text);
      console.log('🔄 Using keyword scoring for Item 6:', level);
    } else {
      level = llmResult.score;
      console.log('🤖 Using LLM scoring for Item 6:', level, llmResult.reasoning);
    }
    
    const scoreMap = { 1: 1, 2: 2, 3: 4, 4: 5 };
    update({ a5: scoreMap[level] || 2, item6Level: level });
    trackAnalyticsEvent('item_completed', { 
      item: 6, 
      followUpLevel: level, 
      textLength: text.length,
      scoringMethod: llmResult.useFallback ? 'keyword' : 'llm'
    });
    setScreen(SCREENS.LOADING);
  };

  const level = computeLevel(scoresRef.current);
  const relationshipStatus = computeRelationshipStatus(scoresRef.current, level);
  const insights = generateInsights(scoresRef.current, level);

  const screenMap = {
    [SCREENS.LANDING]: <Landing onStart={() => setScreen(SCREENS.ITEM1)} />,
    [SCREENS.ITEM1]: <Item1 onAnswer={handleItem1} />,
    [SCREENS.ITEM1_REVEAL]: <Item1Reveal correct={scores.a3 > 0} onContinue={() => setScreen(SCREENS.ITEM2)} />,
    [SCREENS.ITEM2]: <Item2 onAnswer={handleItem2} />,
    [SCREENS.ITEM2_REVEAL]: <Item2Reveal scores={scores} onContinue={() => setScreen(SCREENS.ITEM3)} />,
    [SCREENS.ITEM3]: <Item3 onAnswer={handleItem3} />,
    [SCREENS.ITEM3_REVEAL]: <Item3Reveal correct={scores.item3Correct} onContinue={() => setScreen(SCREENS.ITEM4)} />,
    [SCREENS.ITEM4]: <Item4 onAnswer={handleItem4} />,
    [SCREENS.ITEM4_REVEAL]: <Item4Reveal choice={scores.item4Choice} onContinue={() => setScreen(SCREENS.ITEM5A)} />,
    [SCREENS.ITEM5A]: <Item5a onAnswer={handleItem5a} />,
    [SCREENS.ITEM5A_REVEAL]: <Item5aReveal apology={scores.apologyAnswer} allergy={scores.allergyAnswer} onContinue={() => setScreen(SCREENS.ITEM5B)} />,
    [SCREENS.ITEM5B]: <Item5b onAnswer={handleItem5b} />,
    [SCREENS.ITEM5B_REVEAL]: <Item5bReveal level={scores.promptLevel} onContinue={() => setScreen(SCREENS.ITEM6)} />,
    [SCREENS.ITEM6]: <Item6 onAnswer={handleItem6} />,
    [SCREENS.LOADING]: <LoadingScreen onDone={() => setScreen(SCREENS.CAPTURE)} />,
    [SCREENS.CAPTURE]: <LeadCapture level={level} scores={scores} relationshipStatus={relationshipStatus} onSubmit={(leadData) => { window.__aiLevelLead = leadData; setScreen(SCREENS.REVEAL); }} />,
    [SCREENS.REVEAL]: <LevelReveal level={level} scores={scores} insights={insights} relationshipStatus={relationshipStatus} />,
  };

  return <div className="font-sans antialiased">{screenMap[screen]}</div>;
}

// Main App component with routing
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AILevel />} />
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
