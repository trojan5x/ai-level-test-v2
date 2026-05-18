import { useState, useEffect, useRef, useCallback } from "react";

// ─── Co-Branding Config ────────────────────────────────
// Swap this object to co-brand with any partner. Default = LearnTube standalone.
const BRAND_CONFIG = {
  host: { name: "LearnTube", tagline: "4M+ users", color: "#3b82f6" },
  partner: null,       // { name: "ImagiNxt", logo_url: "", color: "#...", event_name: "ImagiNxt 2026" }
  ai_partner: null,    // { name: "Claude", logo_url: "" }
  tool_partner: null,  // { name: "Gamma", logo_url: "" }
  share_hashtag: "#AILevel",
  share_url: "ai-level.learntube.ai",
  partner_questions: [],  // [{ question: "...", placeholder: "..." }]
};

const SCREENS = {
  LANDING: "landing",
  SELF_SELECT: "self_select",
  CONTEXT: "context",
  BEHAVIORAL_FREQ: "behavioral_freq",
  AI_DIET: "ai_diet",
  ITEM1: "item1",
  ITEM1_REVEAL: "item1_reveal",
  ITEM2: "item2",
  ITEM2_REVEAL: "item2_reveal",
  ITEM3: "item3",
  ITEM3_REVEAL: "item3_reveal",
  ITEM3B: "item3b",
  ITEM3B_REVEAL: "item3b_reveal",
  ITEM4: "item4",
  ITEM4_REVEAL: "item4_reveal",
  ITEM5A: "item5a",
  ITEM5A_REVEAL: "item5a_reveal",
  ITEM5B: "item5b",
  ITEM5B_REVEAL: "item5b_reveal",
  ITEM6: "item6",
  WORKFLOW_DESIGN: "workflow_design",
  WORKFLOW_DESIGN_REVEAL: "workflow_design_reveal",
  SYSTEM_BUILDER: "system_builder",
  SYSTEM_BUILDER_REVEAL: "system_builder_reveal",
  PARTNER_MODULE: "partner_module",
  LOADING: "loading",
  CAPTURE: "capture",
  REVEAL: "reveal",
};

// ─── Phase System ──────────────────────────────────────
const PHASES = {
  1: { name: "AI Tool User", range: "L0–L2", description: "You use AI as a tool — for tasks, drafts, and answers.", color: "#3b82f6", emoji: "🔧" },
  2: { name: "AI Co-worker", range: "L3–L4", description: "You work WITH AI — evaluating, iterating, designing workflows.", color: "#10b981", emoji: "🤝" },
  3: { name: "AI System Builder", range: "L5–L6", description: "You build systems — orchestrating agents, multiplying others.", color: "#f59e0b", emoji: "⚡" },
};
function getPhase(level) {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  return 3;
}

// ─── Tool Feature Depth ───────────────────────���────────
const TOOL_FEATURES = {
  "ChatGPT": [
    { id: "custom_gpts", label: "Custom GPTs", advanced: true },
    { id: "canvas", label: "Canvas", advanced: false },
    { id: "codex", label: "Codex (Async Agent)", advanced: true },
    { id: "operator", label: "Operator", advanced: true },
    { id: "image_gen", label: "Image Gen", advanced: false },
    { id: "voice", label: "Advanced Voice", advanced: false },
    { id: "deep_research_gpt", label: "Deep Research", advanced: true },
  ],
  "Claude": [
    { id: "projects", label: "Projects", advanced: false },
    { id: "artifacts", label: "Artifacts", advanced: false },
    { id: "claude_code", label: "Claude Code", advanced: true },
    { id: "mcp", label: "MCP Servers", advanced: true },
    { id: "managed_agents", label: "Managed Agents", advanced: true },
    { id: "computer_use", label: "Computer Use", advanced: true },
  ],
  "Gemini": [
    { id: "gems", label: "Gems", advanced: true },
    { id: "deep_research", label: "Deep Research", advanced: true },
    { id: "deep_research_max", label: "Deep Research Max", advanced: true },
    { id: "notebook_lm", label: "NotebookLM", advanced: true },
    { id: "ai_studio", label: "AI Studio / API", advanced: true },
  ],
  "GitHub Copilot": [
    { id: "code_complete", label: "Code Completion", advanced: false },
    { id: "copilot_agent_mode", label: "Agent Mode", advanced: true },
    { id: "copilot_workspace", label: "Copilot Workspace", advanced: true },
    { id: "copilot_mcp", label: "MCP Extensions", advanced: true },
  ],
  "Cursor": [
    { id: "cursor_composer", label: "Composer", advanced: true },
    { id: "cursor_agent", label: "Agent Mode", advanced: true },
    { id: "cursor_background", label: "Background Agents", advanced: true },
    { id: "cursor_chat", label: "Chat", advanced: false },
  ],
  "Windsurf": [
    { id: "windsurf_cascade", label: "Cascade (Agent)", advanced: true },
    { id: "windsurf_flows", label: "Flows", advanced: true },
    { id: "windsurf_parallel", label: "Parallel Agents", advanced: true },
    { id: "windsurf_chat", label: "Chat", advanced: false },
  ],
  "Perplexity": [
    { id: "perplexity_pro", label: "Pro Search", advanced: false },
    { id: "perplexity_spaces", label: "Spaces", advanced: true },
    { id: "perplexity_assistant", label: "Assistant", advanced: true },
  ],
  "Midjourney / Image AI": [
    { id: "midjourney", label: "Midjourney", advanced: false },
    { id: "ideogram", label: "Ideogram", advanced: false },
    { id: "flux", label: "Flux", advanced: true },
  ],
};

const USE_CASES = [
  { id: "writing", label: "Writing & Comms", emoji: "✍️" },
  { id: "research", label: "Research & Analysis", emoji: "🔍" },
  { id: "coding", label: "Coding & Engineering", emoji: "💻" },
  { id: "data", label: "Data & Dashboards", emoji: "📊" },
  { id: "brainstorm", label: "Strategy & Ideation", emoji: "💡" },
  { id: "meetings", label: "Meetings & Docs", emoji: "📋" },
  { id: "automation", label: "Workflows & Agents", emoji: "⚙️" },
  { id: "creative", label: "Design & Media", emoji: "🎨" },
];

// ─── Path Routing ─────────────────────────────────────
const PATHS = { A: "foundation", B: "core", C: "advanced" };

function determinePath(selfSelectedLevel, dietScore, featureDepthScore) {
  // Path A (Foundation): beginners
  if (selfSelectedLevel <= 1 && dietScore <= 1) return PATHS.A;
  // Path C (Advanced): experienced users with tool depth
  if (selfSelectedLevel >= 3 && (dietScore >= 2 || featureDepthScore >= 2)) return PATHS.C;
  // Path B: default
  return PATHS.B;
}

// ─── Scoring Engine ──────────────────────────────────────
function scoreBehavioralFreq(choices) {
  // Each pair: option "b" indicates higher AI maturity behavior
  // Returns 0-4 (number of mature-behavior selections)
  if (!choices) return 0;
  return Object.values(choices).filter(v => v === "b").length;
}

function scoreAIDiet(dietLevel, toolCount, featureDepthScore, useCaseCount) {
  // dietLevel: 0=none, 1=single tool shallow, 2=multi-tool, 3=builds systems
  // toolCount: how many tools selected
  // featureDepthScore: 0-4 based on advanced feature usage
  // useCaseCount: number of use cases selected
  if (dietLevel === 0) return 0;
  if (dietLevel === 1) return featureDepthScore >= 1 ? 2 : 1;
  if (dietLevel === 2) {
    const base = toolCount >= 3 ? 3 : 2;
    return featureDepthScore >= 2 ? Math.min(base + 1, 4) : base;
  }
  return 4; // system builder
}

function scoreFeatureDepth(selectedFeatures) {
  if (!selectedFeatures || selectedFeatures.length === 0) return 0;
  const advancedCount = selectedFeatures.filter(f => {
    for (const tool of Object.values(TOOL_FEATURES)) {
      const feat = tool.find(t => t.id === f);
      if (feat?.advanced) return true;
    }
    return false;
  }).length;
  if (advancedCount >= 4) return 4;
  if (advancedCount >= 2) return 3;
  if (advancedCount >= 1) return 2;
  return selectedFeatures.length >= 3 ? 1 : 0;
}

function computeLevel(scores) {
  const total = scores.a1 + scores.a2 + scores.a3 + scores.a4 + scores.a5;
  const item3Correct = scores.item3Correct;
  const item3bCorrect = scores.item3bCorrect;
  const item4Choice = scores.item4Choice;
  const item6Level = scores.item6Level;
  const behavFreq = scores.behavFreqScore || 0;
  const dietScore = scores.dietScore || 0;
  const workflowScore = scores.workflowScore || 0;
  const systemBuilderScore = scores.systemBuilderScore || 0;
  const featureDepth = scores.featureDepthScore || 0;

  // L0: Very low engagement / scores + no AI usage
  if (total <= 4 && dietScore === 0) return 0;
  if (total <= 4) return 0;
  // L1: Low total, limited understanding
  if (total <= 7) return 1;
  // L2 ceiling: Artifact Effect gatekeeper — wrong on Item 3 caps at L2
  // Also: accepting or polishing AI output (A/B on Item 4) caps at L2
  if (!item3Correct || item4Choice === "A" || item4Choice === "B") return 2;
  // L5: Path C — strong workflow design + system builder + all previous gates passed
  if (workflowScore >= 3 && systemBuilderScore >= 3 && total >= 18 && item6Level >= 3 && featureDepth >= 3) return 5;
  // L4: High total + deep follow-up + passed all gatekeepers + strong behavioral/tool signals
  if (total >= 18 && item6Level >= 3 && (behavFreq >= 3 || dietScore >= 3)) return 4;
  if (total >= 18 && item6Level >= 3) return 4;
  // L4 also reachable via Path C with moderate workflow/system scores
  if (workflowScore >= 2 && systemBuilderScore >= 2 && total >= 14 && item3Correct) return 4;
  // L3: Passed gatekeepers (Item 3 correct, Item 4 C/D)
  if (item3Correct && (item4Choice === "C" || item4Choice === "D")) return 3;
  return 2;
}

function getPercentile(level) {
  const map = { 0: 95, 1: 65, 2: 34, 3: 12, 4: 5, 5: 1, 6: 0.1 };
  return map[level] || 34;
}

const LEVEL_DATA = {
  0: {
    name: "Non-User",
    tagline: "You haven't started yet — but now you know exactly where you stand. That's more than most people ever find out.",
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
    tagline: "You don't just use AI — you build systems that make other people better at it. The frontier moves because of people like you.",
    color: "#f97316",
    tier: "Architect",
  },
  6: {
    name: "Pioneer",
    tagline: "You're advancing the frontier itself — building what doesn't exist yet. This level isn't reachable in this assessment.",
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
    scores.behavFreqScore <= 1,
  ].filter(Boolean).length;

  const colleagueSignals = [
    scores.item3Correct,
    scores.item3bCorrect,
    scores.item4Choice === "C" || scores.item4Choice === "D",
    scores.restraintScore >= 2,
    scores.item6Level >= 3,
    scores.behavFreqScore >= 3,
    scores.dietScore >= 3,
  ].filter(Boolean).length;

  if (level >= 3 && petSignals >= 2) return "complicated";
  if (level <= 1 && colleagueSignals >= 3) return "complicated";
  if (level >= 4 && colleagueSignals >= 5) return "merged";
  if (level >= 3 && colleagueSignals >= 4) return "merged";
  if (colleagueSignals >= 3 && level >= 2) return "committed";
  if (level === 0 && scores.dietScore === 0) return "single";
  if (level === 0) return "casual";
  if (petSignals >= 3) return "complicated";
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
  const l4Keywords = ["bet against", "opposite", "disagree", "abandon", "same data", "wrong entirely", "flawed", "reverse", "what if the real"];
  const l3Keywords = ["assumption", "what if", "counterargument", "wrong", "unrealistic", "actually", "not seeing", "strongest argument", "reframe", "challenge", "evidence", "how do you know", "prove", "alternative explanation", "correlation", "causation"];
  const l2Keywords = ["specific", "numbers", "how much", "break down", "factor", "which one", "example", "data", "metric", "quantify"];
  const l1Keywords = ["bullet", "shorter", "detail", "explain", "format", "summary", "list", "more"];
  if (l4Keywords.some(k => t.includes(k))) return 4;
  if (l3Keywords.filter(k => t.includes(k)).length >= 1) return 3;
  if (l2Keywords.some(k => t.includes(k))) return 2;
  if (l1Keywords.some(k => t.includes(k)) || t.length < 30) return 1;
  return 2;
}

// ─── UI Primitives ──────────────────────────────────────

function ProgressBar({ current, total = 13, label }) {
  const pct = Math.min(((current) / total) * 100, 100);
  return (
    <div className="w-full max-w-xs mx-auto mb-6">
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <div className="text-center mt-1.5">
          <span className="text-gray-600 text-[10px]">{label}</span>
        </div>
      )}
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`transition-all duration-600 ease-out ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
      } ${className}`}
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
      <span className="text-lg">{correct ? "✦" : "��"}</span>
      {label}
    </div>
  );
}

function TimedAdvance({ duration = 3500, onComplete, label = "Next →" }) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);
  const startRef = useRef(Date.now());
  const frameRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1 && !doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current();
      } else if (pct < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [duration]);

  const skip = () => {
    if (!doneRef.current) {
      doneRef.current = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      onCompleteRef.current();
    }
  };

  return (
    <button
      onClick={skip}
      className="group relative mt-6 px-8 py-3 rounded-2xl font-semibold text-sm bg-gray-800/60 text-gray-300 hover:text-white transition-colors overflow-hidden"
    >
      {/* Fill bar */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-400/30 rounded-2xl transition-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-6 left-6 z-50 flex items-center gap-1 text-gray-600 hover:text-gray-300 transition-colors text-sm"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-xs">Back</span>
    </button>
  );
}

// ─── Landing ────────────────────────────────────────────
function Landing({ onStart }) {
  const bp = BRAND_CONFIG.partner;
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/6 rounded-full blur-3xl" />

        <FadeIn>
          <div className="text-center max-w-sm relative z-10">
            {/* Brand badge — adapts to co-branding */}
            <div className="inline-flex items-center gap-2 bg-gray-900/60 border border-gray-800/40 rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-400 text-[10px] font-bold tracking-wider">{BRAND_CONFIG.host.name.toUpperCase()}</span>
              {bp && (
                <>
                  <span className="text-gray-700 text-[10px]">×</span>
                  <span className="text-[10px] font-bold tracking-wider" style={{ color: bp.color || "#a78bfa" }}>{bp.name.toUpperCase()}</span>
                </>
              )}
              {!bp && (
                <>
                  <span className="text-gray-700 text-[10px]">|</span>
                  <span className="text-gray-500 text-[10px]">{BRAND_CONFIG.host.tagline}</span>
                </>
              )}
            </div>

            {/* Event name if co-branded */}
            {bp?.event_name && (
              <p className="text-gray-500 text-[11px] mb-6 tracking-wide">{bp.event_name}</p>
            )}

            <h1 className="text-4xl font-bold mb-3 leading-[1.15] bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Find your AI Level
            </h1>
            <p className="text-gray-400 text-sm mb-2">7 levels. Under 10 minutes.</p>
            <p className="text-gray-600 text-xs mb-8">Most people overestimate by 2 levels.</p>

            <button
              onClick={onStart}
              className="group bg-white text-gray-950 font-semibold px-10 py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg hover:shadow-white/10"
            >
              Take the test
              <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>

            <div className="mt-6 flex items-center justify-center gap-4">
              <p className="text-gray-600 text-xs">Based on research from BCG, Anthropic & MIT Media Lab</p>
            </div>

            {/* Social proof ticker */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-500 text-[10px]">2,847 people assessed this week</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Self-Selection (Perception Gap Setup) ──────────────
function SelfSelect({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const levels = [
    { level: 0, label: "Non-User", desc: "I don't really use AI" },
    { level: 1, label: "Experimenter", desc: "I've tried it a few times for simple tasks" },
    { level: 2, label: "Functional User", desc: "I use AI regularly and get real value from it" },
    { level: 3, label: "Effective Practitioner", desc: "I evaluate AI output critically and iterate on substance" },
    { level: 4, label: "AI-Native Performer", desc: "AI is embedded in how I think and work — I've redesigned my workflow around it" },
    { level: 5, label: "AI-Native Builder", desc: "I build AI systems and workflows that multiply others' capabilities" },
    { level: 6, label: "Pioneer", desc: "I advance the frontier — not something this assessment awards" },
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-10">
        <ProgressBar current={1} total={10} />
        <FadeIn>
          <div className="max-w-md text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Where do you think you are?</h2>
            <p className="text-gray-500 text-sm">We'll compare this to your actual score at the end.</p>
          </div>
        </FadeIn>
        <div className="max-w-md w-full space-y-1.5">
          {levels.map((l, i) => (
            <FadeIn key={l.level} delay={i * 60}>
              <button
                onClick={() => setSelected(l.level)}
                className={`text-left w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                  selected === l.level
                    ? "border-blue-500/60 bg-blue-500/5 shadow-lg shadow-blue-500/5"
                    : "border-gray-800/40 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-right ${selected === l.level ? "text-blue-400" : "text-gray-600"}`}>{l.level}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${selected === l.level ? "text-white" : "text-gray-300"}`}>{l.label}</span>
                    <span className="text-gray-500 text-[11px] ml-2">{l.desc}</span>
                  </div>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={() => selected !== null && onSelect(selected)}
            disabled={selected === null}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              selected !== null
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Context Collection ─────────────────────────────────
function ContextCollection({ onSubmit }) {
  const [persona, setPersona] = useState(null); // "student" | "professional" | "founder"
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");

  const personas = [
    { id: "student", label: "Student", emoji: "🎓" },
    { id: "professional", label: "Working Professional", emoji: "💼" },
    { id: "founder", label: "Business Owner / Freelancer", emoji: "🚀" },
  ];

  const fieldConfig = {
    student: { f1: "Field of study", f1ph: "e.g. Computer Science, MBA, Design", f2: "College / University", f2ph: "e.g. IIT Bombay, NMIMS, Christ University" },
    professional: { f1: "Your role", f1ph: "e.g. Product Manager, Software Engineer, Marketing Lead", f2: "Company", f2ph: "e.g. TCS, Razorpay, Zomato" },
    founder: { f1: "What you do", f1ph: "e.g. Run a D2C brand, Freelance designer, AI consultant", f2: "Company / Brand name", f2ph: "e.g. Acme Studios" },
  };

  const config = persona ? fieldConfig[persona] : null;
  const canSubmit = persona && field1.trim().length >= 2 && field2.trim().length >= 2;

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-10">
        <ProgressBar current={2} total={10} />
        <FadeIn>
          <div className="max-w-md text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">A little about you</h2>
            <p className="text-gray-500 text-sm">This helps us personalize your results and compare you to peers in your field.</p>
          </div>
        </FadeIn>
        <div className="max-w-md w-full">
          {/* Persona toggle */}
          <FadeIn delay={100}>
            <div className="flex gap-2 mb-5">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPersona(p.id); setField1(""); setField2(""); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    persona === p.id
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  <span className="mr-1.5">{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Dynamic fields */}
          {config && (
            <FadeIn delay={150}>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">{config.f1}</label>
                  <input
                    type="text"
                    value={field1}
                    onChange={e => setField1(e.target.value)}
                    placeholder={config.f1ph}
                    autoFocus
                    className="w-full bg-gray-900/50 border border-gray-800/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">{config.f2}</label>
                  <input
                    type="text"
                    value={field2}
                    onChange={e => setField2(e.target.value)}
                    placeholder={config.f2ph}
                    className="w-full bg-gray-900/50 border border-gray-800/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-600"
                  />
                </div>
              </div>
            </FadeIn>
          )}

          {canSubmit && (
            <FadeIn delay={100}>
              <button
                onClick={() => onSubmit({ persona, field1: field1.trim(), field2: field2.trim() })}
                className="mt-6 w-full bg-white text-gray-950 font-semibold py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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

// ─── Behavioral Frequency (One-at-a-time Forced-Choice) ─
function BehavioralFrequency({ onSubmit }) {
  const [choices, setChoices] = useState({});
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const pairs = [
    {
      id: "iterate",
      a: "I accept AI's first output if it looks reasonable",
      b: "I push back on AI's first output even when it looks good",
    },
    {
      id: "tools",
      a: "I use one AI tool for most things",
      b: "I switch between tools depending on the task",
    },
    {
      id: "start",
      a: "I start working on tasks directly",
      b: "I first consider whether AI could handle part of it",
    },
    {
      id: "evaluate",
      a: "I judge AI output by whether it looks right",
      b: "I check AI output against what I know, even when it looks polished",
    },
  ];

  const handleSelect = (option) => {
    if (animating) return;
    const pair = pairs[current];
    const updated = { ...choices, [pair.id]: option };
    setChoices(updated);

    // Auto-advance after brief delay
    setAnimating(true);
    setTimeout(() => {
      if (current < pairs.length - 1) {
        setCurrent(current + 1);
        setAnimating(false);
      } else {
        // All done — submit
        onSubmit(updated);
      }
    }, 400);
  };

  const pair = pairs[current];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-10">
        <ProgressBar current={3} total={10} />
        {/* Step dots */}
        <div className="flex items-center gap-2 mb-8">
          {pairs.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < current ? "w-2 h-2 bg-blue-500"
                : i === current ? "w-6 h-2 bg-blue-400 rounded-full"
                : "w-2 h-2 bg-gray-800"
              }`}
            />
          ))}
        </div>

        <FadeIn>
          <div className="max-w-sm text-center mb-8">
            <h2 className="text-2xl font-bold mb-1">Which is more like you?</h2>
            <p className="text-gray-600 text-xs">Tap one</p>
          </div>
        </FadeIn>

        {/* Single pair — two big tappable cards */}
        <div key={pair.id} className={`max-w-sm w-full space-y-3 transition-all duration-300 ${animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
          <button
            onClick={() => handleSelect("a")}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              choices[pair.id] === "a"
                ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                : "border-gray-800/60 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/60 active:scale-[0.98]"
            }`}
          >
            <p className={`text-sm leading-relaxed ${choices[pair.id] === "a" ? "text-white font-medium" : "text-gray-300"}`}>
              {pair.a}
            </p>
          </button>

          <div className="flex items-center justify-center">
            <span className="text-gray-700 text-[10px] font-medium tracking-widest">OR</span>
          </div>

          <button
            onClick={() => handleSelect("b")}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              choices[pair.id] === "b"
                ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                : "border-gray-800/60 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/60 active:scale-[0.98]"
            }`}
          >
            <p className={`text-sm leading-relaxed ${choices[pair.id] === "b" ? "text-white font-medium" : "text-gray-300"}`}>
              {pair.b}
            </p>
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── AI Diet (Tool Usage Matrix) ────────────────────────
function AIDiet({ onSubmit }) {
  const [step, setStep] = useState(0); // 0=usage level, 1=tools+features, 2=use cases
  const [dietLevel, setDietLevel] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedUseCases, setSelectedUseCases] = useState([]);

  const options = [
    { id: 0, text: "I don't really use AI tools", emoji: "🚫" },
    { id: 1, text: "One tool for quick answers and drafts", emoji: "💬" },
    { id: 2, text: "Multiple tools depending on the task", emoji: "🔀" },
    { id: 3, text: "I've built custom GPTs, automations, or workflows", emoji: "⚙️" },
  ];

  const tools = ["ChatGPT", "Claude", "Gemini", "Copilot", "Perplexity", "Midjourney / DALL-E", "Cursor / Windsurf", "Other"];

  const toggleTool = (tool) => {
    setSelectedTools(prev => {
      const next = prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool];
      // Clear features for deselected tools
      if (!next.includes(tool)) {
        const toolFeats = (TOOL_FEATURES[tool] || []).map(f => f.id);
        setSelectedFeatures(sf => sf.filter(f => !toolFeats.includes(f)));
      }
      return next;
    });
  };

  const toggleFeature = (fid) => {
    setSelectedFeatures(prev => prev.includes(fid) ? prev.filter(f => f !== fid) : [...prev, fid]);
  };

  const toggleUseCase = (ucId) => {
    setSelectedUseCases(prev => prev.includes(ucId) ? prev.filter(u => u !== ucId) : [...prev, ucId]);
  };

  // Features for currently selected tools
  const availableFeatures = selectedTools
    .filter(t => TOOL_FEATURES[t])
    .map(t => ({ tool: t, features: TOOL_FEATURES[t] }));

  const handleDietSelect = (id) => {
    setDietLevel(id);
    if (id === 0) {
      // No AI usage — skip to submit
      onSubmit(0, [], [], [], 0);
    } else {
      setTimeout(() => setStep(1), 200);
    }
  };

  const handleToolsContinue = () => {
    setStep(2);
  };

  const handleFinalSubmit = () => {
    const fdScore = scoreFeatureDepth(selectedFeatures);
    onSubmit(dietLevel, selectedTools, selectedFeatures, selectedUseCases, fdScore);
  };

  // Step 0: Usage level
  if (step === 0) {
    return (
      <ScreenTransition>
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-10">
          <ProgressBar current={4} total={10} />
          <FadeIn>
            <div className="max-w-lg text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">What's your AI diet?</h2>
              <p className="text-gray-500 text-sm">Pick the one closest to how you actually use AI today.</p>
            </div>
          </FadeIn>
          <div className="max-w-md w-full space-y-2">
            {options.map((opt, i) => (
              <FadeIn key={opt.id} delay={i * 80}>
                <button
                  onClick={() => handleDietSelect(opt.id)}
                  className={`text-left w-full px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                    dietLevel === opt.id
                      ? "border-blue-500/60 bg-blue-500/5"
                      : "border-gray-800/40 bg-gray-900/30 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{opt.emoji}</span>
                    <p className={`text-sm ${dietLevel === opt.id ? "text-white font-medium" : "text-gray-300"}`}>{opt.text}</p>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </ScreenTransition>
    );
  }

  // Step 1: Tools + feature depth
  if (step === 1) {
    return (
      <ScreenTransition>
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-6 py-10 overflow-auto">
          <FadeIn>
            <div className="max-w-lg text-center mb-5">
              <h2 className="text-2xl font-bold mb-2">Which tools do you use?</h2>
              <p className="text-gray-500 text-sm">Tap the tools, then check the features you've actually used.</p>
            </div>
          </FadeIn>

          {/* Tool chips */}
          <div className="max-w-lg w-full mb-4">
            <div className="flex flex-wrap gap-2">
              {tools.map(tool => (
                <button
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedTools.includes(tool)
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Feature sub-chips per selected tool */}
          {availableFeatures.length > 0 && (
            <FadeIn delay={100}>
              <div className="max-w-lg w-full space-y-3 mb-4">
                {availableFeatures.map(({ tool, features }) => (
                  <div key={tool}>
                    <p className="text-gray-500 text-[11px] font-medium mb-1.5">{tool} features you've used:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {features.map(f => (
                        <button
                          key={f.id}
                          onClick={() => toggleFeature(f.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                            selectedFeatures.includes(f.id)
                              ? f.advanced
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                              : "bg-gray-800/40 text-gray-500 border border-gray-800/30 hover:text-gray-400"
                          }`}
                        >
                          {f.label}
                          {f.advanced && selectedFeatures.includes(f.id) && <span className="ml-1 text-[9px] opacity-70">★</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          )}

          <div className="mt-4">
            <button
              onClick={() => selectedTools.length > 0 && handleToolsContinue()}
              disabled={selectedTools.length === 0}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                selectedTools.length > 0
                  ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                  : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
              }`}
            >
              Continue →
            </button>
          </div>
        </div>
      </ScreenTransition>
    );
  }

  // Step 2: Use cases
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-10">
        <FadeIn>
          <div className="max-w-lg text-center mb-5">
            <h2 className="text-2xl font-bold mb-2">What do you use AI for?</h2>
            <p className="text-gray-500 text-sm">Tap all that apply. This helps us understand your AI breadth.</p>
          </div>
        </FadeIn>
        <div className="max-w-md w-full">
          <div className="grid grid-cols-2 gap-2">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={uc.id} delay={i * 50}>
                <button
                  onClick={() => toggleUseCase(uc.id)}
                  className={`text-left px-3.5 py-3 rounded-xl border transition-all duration-200 ${
                    selectedUseCases.includes(uc.id)
                      ? "border-blue-500/50 bg-blue-500/5"
                      : "border-gray-800/40 bg-gray-900/30 hover:border-gray-700"
                  }`}
                >
                  <span className="text-sm mr-1.5">{uc.emoji}</span>
                  <span className={`text-xs font-medium ${selectedUseCases.includes(uc.id) ? "text-white" : "text-gray-400"}`}>{uc.label}</span>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={() => selectedUseCases.length > 0 && handleFinalSubmit()}
            disabled={selectedUseCases.length === 0}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              selectedUseCases.length > 0
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 1: Spot the AI ────────────────────────────────
function Item1({ onAnswer }) {
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <ProgressBar current={5} total={10} />
        <FadeIn>
          <div className="max-w-lg text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Spot the human.</h2>
            <p className="text-gray-500 text-sm">One was written by a person. One by AI.</p>
          </div>
        </FadeIn>
        <div className="max-w-2xl w-full grid md:grid-cols-2 gap-4">
          <FadeIn delay={200}>
            <button
              onClick={() => onAnswer("A")}
              className="group text-left p-6 rounded-2xl border border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 transition-all duration-300 w-full"
            >
              <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest">A</div>
              <p className="text-gray-300 leading-relaxed text-sm">
                Working from home kills focus. Set up in one spot, close every tab except what you need, and use a timer. Real work happens in blocks of uninterrupted time. Don't pretend you're being productive while scrolling. You're not.
              </p>
            </button>
          </FadeIn>
          <FadeIn delay={350}>
            <button
              onClick={() => onAnswer("B")}
              className="group text-left p-6 rounded-2xl border border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 transition-all duration-300 w-full"
            >
              <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest">B</div>
              <p className="text-gray-300 leading-relaxed text-sm">
                To maximize productivity while working from home, establish a dedicated workspace and implement time-blocking techniques. Minimize digital distractions by organizing your digital environment and utilizing focus tools. Consistent routines enhance concentration and output quality.
              </p>
            </button>
          </FadeIn>
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
            <p className="text-gray-600 text-sm">
              {correct
                ? "Most people pick the polished one. You didn't."
                : "This is the most common mistake — and it matters more than you think."}
            </p>
            <TimedAdvance duration={3500} onComplete={onContinue} />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 2: Calibration Probe ──────────────────────────
function Item2({ onAnswer }) {
  const [ratings, setRatings] = useState({});
  const tasks = [
    { id: "email", text: "Write a professional email politely declining a job offer", icon: "✉" },
    { id: "finance", text: "Analyze your company's finances and decide where to cut costs", icon: "📊" },
    { id: "social", text: "Generate 10 social media post ideas for a coffee shop", icon: "☕" },
    { id: "mailbox", text: "Check your physical mailbox and tell you what packages arrived", icon: "📦" },
  ];
  const options = ["Nail it", "Be OK", "Fail"];
  const allAnswered = Object.keys(ratings).length === 4;

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={6} total={10} />
        <FadeIn>
          <div className="max-w-lg text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">How good is AI at this?</h2>
            <p className="text-gray-500 text-sm">For each task: would AI nail it, be OK, or fail?</p>
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
        <div className="mt-8">
          <button
            onClick={() => allAnswered && onAnswer(ratings)}
            disabled={!allAnswered}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              allAnswered
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            {allAnswered ? "Continue →" : `Rate all ${4 - Object.keys(ratings).length} remaining`}
          </button>
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
            <p className="text-gray-300 text-lg leading-relaxed">{msg}</p>
            <TimedAdvance duration={3500} onComplete={onContinue} />
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

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={7} total={10} />
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
            <div className="max-w-md text-center">
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
            <TimedAdvance duration={4000} onComplete={onContinue} />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 3b: Agreement Trap ───────────────────────────
function Item3b({ onAnswer }) {
  const [selected, setSelected] = useState(null);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={7} total={10} />
        <FadeIn>
          <div className="max-w-lg text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">Which response shows better judgment?</h2>
            <p className="text-gray-500 text-sm">You asked AI: "Our competitor just launched a feature we've had for 6 months. Should we be worried?"</p>
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
              <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest">A</div>
              <p className="text-gray-300 text-xs leading-relaxed">
                You're right to not worry. Since you've had this feature for 6 months, you have a significant head start. Your users are already familiar with it, and your competitor is playing catch-up. Focus on staying ahead with your next innovation rather than looking backward. Your first-mover advantage is real.
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
                The question isn't whether they copied you — it's whether their version is better positioned. Having a feature first doesn't mean you own it. How are your retention numbers on that feature? If usage is flat after 6 months, their fresh launch with better marketing might actually leapfrog you. What does your usage data say?
              </p>
            </button>
          </FadeIn>
        </div>
        <div className="mt-4">
          <button
            onClick={() => selected && onAnswer(selected)}
            disabled={!selected}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              selected
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

function Item3bReveal({ correct, onContinue }) {
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "You caught the yes-man" : "The Agreement Trap"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">
              {correct
                ? "Response A validated the premise without questioning it. B challenged the assumption — 'having it first doesn't mean you own it.' That's the AI you want."
                : "Response A told you what you wanted to hear. It agreed with your framing ('should we be worried?' → 'you're right to not worry') without actually analyzing anything."}
            </p>
            <div className={`rounded-xl p-4 border mb-8 text-left ${
              correct ? "bg-emerald-500/5 border-emerald-500/15" : "bg-amber-500/5 border-amber-500/15"
            }`}>
              <p className={`text-xs font-medium mb-1 ${correct ? "text-emerald-400/80" : "text-amber-400/80"}`}>
                {correct ? "Why this matters" : "The Agreement Trap"}
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {correct
                  ? "AI defaults to agreeing with your premise. Spotting when it's being a yes-man — vs when it's genuinely analyzing — is how you avoid expensive blind spots."
                  : "AI is trained to be helpful, which often means agreeable. When you phrase a question with a built-in assumption ('should we be worried?'), weaker AI confirms your bias instead of challenging it."}
              </p>
            </div>
            <TimedAdvance duration={4000} onComplete={onContinue} />
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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={8} total={10} />
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
        <div className="mt-6">
          <button
            onClick={() => selected && onAnswer(selected)}
            disabled={!selected}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              selected
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
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
            <p className="text-gray-600 text-sm italic">{d.insight}</p>
            <TimedAdvance duration={3500} onComplete={onContinue} />
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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={9} total={10} />
        <FadeIn>
          <div className="max-w-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Would you use AI here?</h2>
            <p className="text-gray-500 text-sm">Two scenarios. Tap your gut answer.</p>
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
        <div className="mt-6">
          <button
            onClick={() => allDone && onAnswer(a1, a2)}
            disabled={!allDone}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              allDone
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            {allDone ? "Continue →" : "Answer both to continue"}
          </button>
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
            <p className="text-gray-600 text-sm italic">{subMsg}</p>
            <TimedAdvance duration={3500} onComplete={onContinue} />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 5b: Prompt Autopsy ────────────────────────────
function Item5b({ onAnswer }) {
  const [text, setText] = useState("");

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={9} total={10} />
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
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-700 text-xs">{text.length > 0 ? `${text.length} chars` : ""}</span>
              <button
                onClick={() => text.length > 10 && onAnswer(text)}
                disabled={text.length <= 10}
                className={`px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  text.length > 10
                    ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                    : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                }`}
              >
                Continue →
              </button>
            </div>
          </div>
        </FadeIn>
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
            <p className="text-gray-600 text-sm italic">{m.sub}</p>
            <TimedAdvance duration={3500} onComplete={onContinue} label="Almost done →" />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Item 6: What Would You Ask? ────────────────────────
function Item6({ onAnswer, isLastItem, text, onTextChange, progressStep = 10, progressTotal = 10 }) {

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={progressStep} total={progressTotal} />
        <FadeIn>
          <div className="max-w-lg text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">{isLastItem ? "Last one." : "One more thing."}</h2>
            <p className="text-gray-500 text-sm">You asked AI to figure out why your product launch didn't hit its targets. It said:</p>
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="max-w-lg w-full bg-gray-900/50 rounded-2xl p-5 border border-gray-800/60 mb-6">
            <p className="text-gray-400 text-sm leading-relaxed">
              The launch underperformed likely due to three factors: timing (launched during a busy season for your audience), messaging (the value prop wasn't clear in the first 5 seconds), and distribution (you relied on organic reach without paid amplification). To improve next time: test messaging with a small group first, choose a quieter launch window, and allocate budget for initial distribution.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <div className="max-w-lg w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">What's the ONE follow-up you'd ask AI?</p>
              <span className="text-blue-400/60 text-[10px] font-medium bg-blue-400/10 px-2 py-0.5 rounded-full">This one counts</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="The obvious move is asking for more detail. The interesting move is challenging the analysis itself..."
              rows={2}
              className="w-full bg-gray-900/50 border border-gray-800/60 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-700 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => text.length > 10 && onAnswer(text)}
                disabled={text.length <= 10}
                className={`px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  text.length > 10
                    ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                    : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                }`}
              >
                {isLastItem ? "See my results →" : "Continue →"}
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── WorkflowDesign (Path C — A6: Workflow) ─────────────
function WorkflowDesign({ onAnswer }) {
  const [selected, setSelected] = useState(null);

  const scenario = "You're writing a 20-page report with research, data analysis, writing, and editing. You have access to AI tools. How would you structure the workflow?";

  const options = [
    { id: "A", text: "Ask AI to write the full report, then edit it myself.", signal: "low", score: 1 },
    { id: "B", text: "Break it into sections. Use AI for research and first drafts, then rewrite the analysis myself.", signal: "mid", score: 2 },
    { id: "C", text: "Design a pipeline: AI researches → I outline the argument → AI drafts sections from my outline → I edit for voice and accuracy → AI formats.", signal: "high", score: 3 },
    { id: "D", text: "Map which parts AI is best at (research, formatting, data) vs which need my judgment (argument, framing, conclusions). Build a workflow with checkpoints where I review AI output before it feeds into the next step.", signal: "top", score: 4 },
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={8} total={12} />
        <FadeIn>
          <div className="max-w-lg text-center mb-4">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-3">
              <span className="text-purple-400 text-[10px] font-semibold tracking-wider">ADVANCED</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">How would you design this?</h2>
            <p className="text-gray-500 text-sm">{scenario}</p>
          </div>
        </FadeIn>
        <div className="max-w-lg w-full space-y-2.5">
          {options.map((opt, i) => (
            <FadeIn key={opt.id} delay={150 + i * 80}>
              <button
                onClick={() => setSelected(opt.id)}
                className={`text-left w-full p-4 rounded-2xl border transition-all duration-200 ${
                  selected === opt.id
                    ? "border-purple-500/50 bg-purple-500/5"
                    : "border-gray-800/60 bg-gray-900/30 hover:border-gray-700"
                }`}
              >
                <span className="text-purple-400/50 text-xs font-semibold mr-2">{opt.id}.</span>
                <span className="text-gray-300 text-sm">{opt.text}</span>
              </button>
            </FadeIn>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={() => selected && onAnswer(selected, options.find(o => o.id === selected).score)}
            disabled={!selected}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              selected
                ? "bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

function WorkflowDesignReveal({ choice, onContinue }) {
  const data = {
    A: { quality: "low", text: "You're using AI as a ghost writer. Efficient, but you lose control of the thinking.", insight: "The report will sound like AI because AI did all the thinking. Your judgment never entered the process." },
    B: { quality: "mid", text: "Smart division — you kept the hardest thinking for yourself. But the workflow is still serial: you → AI → you.", insight: "The next step is designing the handoffs so AI's work feeds directly into your judgment points." },
    C: { quality: "high", text: "That's a real pipeline. Each step feeds the next, and you're at the control points that matter.", insight: "You're thinking like a systems designer, not a prompt engineer. That's the L4-L5 shift." },
    D: { quality: "top", text: "You mapped capabilities to tasks, built in quality gates, and designed for iteration. That's workflow architecture.", insight: "Most people never think about where AI's judgment should override theirs — you designed for it." },
  };
  const d = data[choice];
  const isHigh = d.quality === "high" || d.quality === "top";

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={isHigh} label={isHigh ? "Workflow architect" : "Getting there"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">{d.text}</p>
            <p className="text-gray-600 text-sm italic">{d.insight}</p>
            <TimedAdvance duration={3500} onComplete={onContinue} />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── SystemBuilder (Path C — A7: Orchestration) ─────────
function SystemBuilder({ onAnswer }) {
  const [checked, setChecked] = useState({});

  const items = [
    { id: "templates", text: "Created reusable prompt templates or saved instructions", tier: 1 },
    { id: "custom_gpt", text: "Built a Custom GPT, Gem, or Claude Project for a specific workflow", tier: 2 },
    { id: "multi_tool", text: "Connected multiple AI tools in a pipeline (e.g., research → draft → review)", tier: 2 },
    { id: "automation", text: "Set up automations where AI runs steps without manual prompting", tier: 3 },
    { id: "team_system", text: "Built an AI system or workflow that other people on your team use", tier: 3 },
    { id: "api_mcp", text: "Used APIs, MCP servers, or built custom integrations with AI", tier: 4 },
  ];

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const computeScore = () => {
    let score = 0;
    items.forEach(item => {
      if (checked[item.id]) score += item.tier;
    });
    if (score >= 10) return 4;
    if (score >= 6) return 3;
    if (score >= 3) return 2;
    if (score >= 1) return 1;
    return 0;
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
        <ProgressBar current={11} total={12} />
        <FadeIn>
          <div className="max-w-lg text-center mb-5">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-3">
              <span className="text-purple-400 text-[10px] font-semibold tracking-wider">ADVANCED</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">What have you built?</h2>
            <p className="text-gray-500 text-sm">Check everything you've actually done. Be honest — this is where it counts.</p>
          </div>
        </FadeIn>
        <div className="max-w-lg w-full space-y-2">
          {items.map((item, i) => (
            <FadeIn key={item.id} delay={i * 80}>
              <button
                onClick={() => toggle(item.id)}
                className={`text-left w-full px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                  checked[item.id]
                    ? "border-purple-500/50 bg-purple-500/5"
                    : "border-gray-800/40 bg-gray-900/30 hover:border-gray-700"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  checked[item.id]
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-700"
                }`}>
                  {checked[item.id] && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${checked[item.id] ? "text-white" : "text-gray-400"}`}>{item.text}</span>
              </button>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={100}>
          <button
            onClick={() => onAnswer(checked, computeScore())}
            className="mt-6 bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
          >
            {checkedCount === 0 ? "None of these — Continue →" : "Continue →"}
          </button>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

function SystemBuilderReveal({ score, onContinue }) {
  const msgs = {
    0: { text: "You haven't built AI systems yet — and that's completely fine at this stage.", sub: "The builder mindset comes after you've mastered the user mindset. You're on the path." },
    1: { text: "You've started building reusable patterns. That's the first step from user to builder.", sub: "Templates and saved instructions are where everyone starts. The next step is connecting tools together." },
    2: { text: "You're building real systems — custom tools and multi-step workflows.", sub: "You're past the 'power user' stage. You're designing how AI fits into work, not just using it." },
    3: { text: "You're an orchestrator. You build systems that run, that others use, that multiply output.", sub: "This is the L4-L5 territory. Most people will never get here." },
    4: { text: "You're building at the infrastructure level. APIs, integrations, custom tooling.", sub: "You're not just using AI — you're extending it. This is frontier territory." },
  };
  const m = msgs[Math.min(score, 4)];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={score >= 2} label={score >= 3 ? "System builder" : score >= 2 ? "Building blocks" : "Foundation laid"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-2">{m.text}</p>
            <p className="text-gray-600 text-sm italic">{m.sub}</p>
            <TimedAdvance duration={3500} onComplete={onContinue} label="See my results →" />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

// ─── Partner Module (injectable questions) ──────────────
function PartnerModule({ onSubmit }) {
  const questions = BRAND_CONFIG.partner_questions || [];
  const [answers, setAnswers] = useState({});

  // If no partner questions configured, auto-skip
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  useEffect(() => {
    if (questions.length === 0) onSubmitRef.current({});
  }, [questions.length]);

  if (questions.length === 0) return null;

  const allDone = questions.every((q, i) => (answers[i] || "").trim().length > 5);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-10">
        <FadeIn>
          <div className="max-w-lg text-center mb-6">
            {BRAND_CONFIG.partner && (
              <div className="inline-flex items-center gap-2 bg-gray-900/60 border border-gray-800/40 rounded-full px-4 py-1.5 mb-4">
                <span className="text-[10px] font-bold tracking-wider" style={{ color: BRAND_CONFIG.partner.color || "#a78bfa" }}>
                  {BRAND_CONFIG.partner.name.toUpperCase()}
                </span>
                <span className="text-gray-700 text-[10px]">×</span>
                <span className="text-blue-400 text-[10px] font-bold tracking-wider">LEARNTUBE</span>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">Almost done — a couple more.</h2>
            <p className="text-gray-500 text-sm">These help us build a richer picture of AI readiness in your field.</p>
          </div>
        </FadeIn>
        <div className="max-w-lg w-full space-y-4">
          {questions.map((q, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-2 block">{q.question}</label>
                <textarea
                  value={answers[i] || ""}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  placeholder={q.placeholder || "Type your answer..."}
                  rows={2}
                  className="w-full bg-gray-900/50 border border-gray-800/60 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-700 resize-none"
                />
              </div>
            </FadeIn>
          ))}
        </div>
        {allDone && (
          <FadeIn delay={100}>
            <button
              onClick={() => onSubmit(answers)}
              className="mt-6 bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              See my results →
            </button>
          </FadeIn>
        )}
      </div>
    </ScreenTransition>
  );
}

// ─── Loading Screen ──���───────────────────────────���──────
function LoadingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0); // 0=analyzing, 1=teaser, 2=done
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const labels = [
    "Analyzing your responses",
    "Scoring across 8 abilities",
    "Mapping your AI phase",
    "Comparing to your self-assessment",
    "Building your profile",
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => setStep(3), 2300);
    const t3b = setTimeout(() => setStep(4), 3000);
    const t4 = setTimeout(() => setPhase(1), 3800);
    const t5 = setTimeout(() => onDoneRef.current(), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t3b); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-64 h-64 rounded-full transition-all duration-[2000ms] ${
            phase >= 1 ? "bg-blue-500/10 scale-150 blur-3xl" : "bg-blue-500/5 scale-100 blur-2xl"
          }`} />
        </div>

        <div className="relative z-10 text-center">
          <div className={`transition-all duration-700 ${phase === 0 ? "opacity-100" : "opacity-0 scale-95"}`}>
            {labels.map((label, i) => (
              <div
                key={i}
                className={`transition-all duration-500 mb-4 ${
                  i <= step ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <span className={`text-sm ${i < step ? "text-blue-400/60" : "text-gray-400"}`}>
                  {i < step ? "✓" : "◆"} {label}
                </span>
              </div>
            ))}
          </div>

          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
            phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}>
            <p className="text-gray-400 text-lg font-medium">Your results are ready.</p>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Lead Capture (Partial Reveal Gate) ─────────────────
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

function LeadCapture({ level, onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
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

  const handleSubmit = () => {
    if (!canSubmit) return;
    const leadData = { name: name.trim(), phone: `${countryCode}${phone.trim()}`, email: email.trim() || null, level, timestamp: Date.now() };
    try { window.__aiLevelLead = leadData; } catch(e) {}
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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-5 py-8 relative overflow-auto">
        {/* Level-colored background glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[100px] opacity-[0.07] pointer-events-none"
          style={{ backgroundColor: data.color }}
        />

        <div className="max-w-sm w-full relative z-10">

          {/* ── Level number (the hook) — compact ── */}
          <div className="text-center mb-4">
            <p className="text-gray-500 text-[10px] font-semibold tracking-[0.25em] uppercase mb-1">Your AI Level</p>
            <div className="text-5xl font-extrabold leading-none" style={{ color: data.color }}>
              {level}
            </div>
          </div>

          {/* ── Locked preview cards (FOMO triggers) — compact rows ── */}
          <div className={`transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <div className="space-y-1.5 mb-4">
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
            <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/40">
              <p className="text-white text-sm font-semibold text-center mb-0.5">Unlock your full AI profile</p>
              <p className="text-gray-500 text-[11px] text-center mb-3">Sent to your WhatsApp — instantly.</p>

              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoCapitalize="words"
                  autoFocus
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500"
                />
                <div className="flex items-center gap-0 bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent text-gray-300 text-sm pl-3 pr-0 py-2.5 focus:outline-none appearance-none cursor-pointer"
                    style={{ minWidth: "72px" }}
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.code} className="bg-gray-900 text-white">
                        {cc.flag} {cc.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    placeholder="WhatsApp number"
                    className="flex-1 bg-transparent py-2.5 pr-4 text-white text-sm focus:outline-none placeholder-gray-500"
                  />
                </div>
                {showEmail ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500"
                  />
                ) : (
                  <button
                    onClick={() => setShowEmail(true)}
                    className="text-gray-500 text-[11px] hover:text-gray-300 transition-colors w-full text-center py-0.5"
                  >
                    + Add email too
                  </button>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full font-semibold py-3 rounded-2xl text-sm transition-all duration-300 ${
                  canSubmit
                    ? "bg-white text-gray-950 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
                    : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canSubmit ? "Unlock my results →" : "Unlock my results"}
              </button>
            </div>
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

// ─── Share Card Canvas Renderer (LinkedIn 1200×627) ─────
// ─── Badge Highlight Selection Engine ─────────────────────
// Picks the 2-3 elements that put THIS person in the best light
// Audience: aspirational Indian professionals who want career signaling
function selectBadgeHighlights(level, scores, selfSelectedLevel, relationshipStatus, percentile) {
  const gap = selfSelectedLevel !== null ? selfSelectedLevel - level : null;
  const highlights = [];

  // ── TIER 1: Always-show elements (if they make you look good) ──

  // Percentile — show if top 35% (aspirational audiences love rank signals)
  if (percentile <= 35) {
    highlights.push({ type: "percentile", value: percentile, weight: level >= 4 ? 95 : 80 });
  }

  // Relationship status — show if it signals seriousness
  // "Committed" and "Merged" = career signals (I take AI seriously)
  // "It's Complicated" = interesting only if level is decent (L3+)
  // "Casual" = only show if level is high (paradox is interesting: high skill, casual relationship)
  // "Single" = never show on badge (no aspirational value)
  if (relationshipStatus === "merged") {
    highlights.push({ type: "relationship", value: "merged", weight: 90 });
  } else if (relationshipStatus === "committed") {
    highlights.push({ type: "relationship", value: "committed", weight: 85 });
  } else if (relationshipStatus === "complicated" && level >= 3) {
    highlights.push({ type: "relationship", value: "complicated", weight: 70 });
  } else if (relationshipStatus === "casual" && level >= 4) {
    highlights.push({ type: "relationship", value: "casual", weight: 60 });
  }

  // ── TIER 2: Conditional elements ──

  // Negative perception gap (underestimated self) — ALWAYS a flex
  if (gap !== null && gap < 0) {
    highlights.push({ type: "gap_positive", value: Math.abs(gap), weight: 88 });
  }

  // Zero perception gap (perfect calibration) — signals precision/self-awareness
  if (gap === 0) {
    highlights.push({ type: "calibration", value: 0, weight: 75 });
  }

  // Positive gap (overestimated) — NEVER on badge for aspirational audience
  // It stays on the results screen for personal insight only

  // Specific strength signal — compensates for mid-level scores
  if (scores.item3Correct && scores.item3bCorrect) {
    highlights.push({ type: "strength", value: "double_vision", weight: level <= 3 ? 78 : 55 });
  } else if (scores.item3Correct) {
    highlights.push({ type: "strength", value: "artifact_effect", weight: level <= 3 ? 72 : 50 });
  }

  // Tool sophistication — signals being current/tech-savvy
  if (scores.featureDepthScore >= 3) {
    highlights.push({ type: "tool_depth", value: scores.featureDepthScore, weight: level <= 3 ? 65 : 45 });
  }

  // Behavioral maturity — signals consistent practice
  if (scores.behavFreqScore >= 3) {
    highlights.push({ type: "behavior", value: scores.behavFreqScore, weight: level <= 2 ? 68 : 40 });
  }

  // ── FALLBACK: If nothing qualified above, provide aspirational framing ──
  // For low-level users with no strong signals, frame the ACT of measuring as forward-thinking
  if (highlights.length === 0) {
    highlights.push({ type: "early_adopter", value: level, weight: 50 });
  }
  // If only one highlight, add a secondary fallback for visual balance
  if (highlights.length === 1 && level <= 2) {
    // Show relationship if it's at least "casual" (they DO use AI)
    if (relationshipStatus !== "single") {
      highlights.push({ type: "relationship", value: relationshipStatus, weight: 40 });
    } else {
      highlights.push({ type: "measured", value: 0, weight: 35 });
    }
  }

  // Sort by weight, take top 2 (level itself is always the hero, these are the supporting highlights)
  highlights.sort((a, b) => b.weight - a.weight);
  return highlights.slice(0, 2);
}

// Generates the aspirational highlight text for the badge
function getBadgeHighlightText(highlight, level, scores, relationshipData) {
  switch (highlight.type) {
    case "percentile":
      return { label: `TOP ${highlight.value}%`, sublabel: "of AI professionals assessed", color: "#60a5fa" };
    case "relationship":
      const rd = relationshipData;
      const relLabels = {
        merged: { label: "AI RELATIONSHIP: MERGED", sublabel: "Thinking is intertwined with AI", color: rd.color },
        committed: { label: "AI RELATIONSHIP: COMMITTED", sublabel: "Intentional working partnership", color: rd.color },
        complicated: { label: "AI RELATIONSHIP: IT'S COMPLICATED", sublabel: "Deep in some areas, gaps in others", color: rd.color },
        casual: { label: "AI RELATIONSHIP: CASUAL", sublabel: "High skill, low dependency", color: rd.color },
      };
      return relLabels[highlight.value] || relLabels.committed;
    case "gap_positive":
      return { label: `+${highlight.value} LEVEL${highlight.value > 1 ? "S" : ""} ABOVE SELF-ESTIMATE`, sublabel: "Better than I thought", color: "#34d399" };
    case "calibration":
      return { label: "PERFECT CALIBRATION", sublabel: "Exact self-assessment — only 12% achieve this", color: "#60a5fa" };
    case "strength":
      if (highlight.value === "double_vision") return { label: "DOUBLE VISION", sublabel: "Caught both the Artifact Effect and Agreement Trap", color: "#2dd4bf" };
      return { label: "SAW THROUGH THE ARTIFACT EFFECT", sublabel: "Judges AI output by substance, not polish", color: "#2dd4bf" };
    case "tool_depth":
      return { label: "ADVANCED TOOL USER", sublabel: "Uses frontier AI features most people haven't discovered", color: "#a78bfa" };
    case "behavior":
      return { label: "CONSISTENT AI PRACTICE", sublabel: "Daily intentional use across multiple domains", color: "#a78bfa" };
    case "early_adopter":
      return { label: "AI READINESS: MEASURED", sublabel: "Ahead of 95% who talk about AI but never assess", color: "#60a5fa" };
    case "measured":
      return { label: "BASELINE ESTABLISHED", sublabel: "Now tracking — growth starts here", color: "#94a3b8" };
    default:
      return { label: "", sublabel: "", color: "#94a3b8" };
  }
}

// ─── Badge Tier Color System (Faceted Gem design) ───
const BADGE_GEM_TIERS = {
  0: { bg: ["#08090f","#0e1018"], gem: ["#5a657a","#7a869e","#95a0b8","#b0bcd0","#d0d8e8"], accent: "#95a0b8", sparkle: "#d0d8e8", name: "STEEL" },
  1: { bg: ["#08090f","#0e1018"], gem: ["#5a657a","#7a869e","#95a0b8","#b0bcd0","#d0d8e8"], accent: "#95a0b8", sparkle: "#d0d8e8", name: "STEEL" },
  2: { bg: ["#020e08","#041a0e"], gem: ["#047857","#059669","#10b981","#34d399","#6ee7b7"], accent: "#34d399", sparkle: "#a7f3d0", name: "EMERALD" },
  3: { bg: ["#020818","#06122d"], gem: ["#1e40af","#2563eb","#3b82f6","#60a5fa","#93c5fd"], accent: "#60a5fa", sparkle: "#bfdbfe", name: "SAPPHIRE" },
  4: { bg: ["#0a0318","#15082e"], gem: ["#6d28d9","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"], accent: "#a78bfa", sparkle: "#ddd6fe", name: "AMETHYST" },
  5: { bg: ["#140a00","#241600"], gem: ["#a16207","#ca8a04","#eab308","#fbbf24","#fde68a"], accent: "#fbbf24", sparkle: "#fef3c7", name: "GOLD" },
  6: { bg: ["#1a0000","#2d0505"], gem: ["#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"], accent: "#f87171", sparkle: "#fecaca", name: "RUBY" },
};

function renderShareCard(canvas, level, levelData, relationshipData, percentile, phaseData, selfSelectedLevel, scores) {
  const ctx = canvas.getContext("2d");
  const S = 1080;
  canvas.width = S;
  canvas.height = S;

  const t = BADGE_GEM_TIERS[Math.min(level, 6)] || BADGE_GEM_TIERS[0];
  const cx = S / 2;
  const levelDisplay = String(level);

  let _seed = level * 1000 + 42;
  function rand() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

  // Resolve relationship
  const relationshipStatus = Object.keys(RELATIONSHIP_DATA).find(k => RELATIONSHIP_DATA[k] === relationshipData) || "casual";
  const REL_WORDS = { merged: "MERGED", committed: "COMMITTED", complicated: "IT’S COMPLICATED", casual: "CASUAL" };
  const relWord = relationshipStatus !== "single" ? (REL_WORDS[relationshipStatus] || null) : null;

  // Helpers
  function hexToRgb(hex) { return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }; }
  const accentRgb = hexToRgb(t.accent);
  const sparkleRgb = hexToRgb(t.sparkle);
  function hexPts(hcx, hcy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 2; pts.push({ x: hcx + r * Math.cos(a), y: hcy + r * Math.sin(a) }); }
    return pts;
  }
  function drawHex(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); }
  function spacedText(text, x, y, sp) {
    let tw = 0; for (const ch of text) tw += ctx.measureText(ch).width + sp;
    let sx = x - tw / 2;
    for (const ch of text) { ctx.fillText(ch, sx + ctx.measureText(ch).width / 2, y); sx += ctx.measureText(ch).width + sp; }
  }

  // ═══ 1. BACKGROUND — Luxe radial + streaks + grain ═══
  const bgGrad = ctx.createRadialGradient(cx, 290, 50, cx, 290, 700);
  bgGrad.addColorStop(0, t.bg[1]); bgGrad.addColorStop(0.4, t.bg[0]); bgGrad.addColorStop(1, "#000000");
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 8; i++) {
    const y = 80 + rand() * 500, alpha = 0.015 + rand() * 0.02;
    const sg = ctx.createLinearGradient(0, y, S, y);
    sg.addColorStop(0, "transparent");
    sg.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${alpha})`);
    sg.addColorStop(0.5, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${alpha * 1.5})`);
    sg.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${alpha})`);
    sg.addColorStop(1, "transparent");
    ctx.fillStyle = sg; ctx.fillRect(0, y - 1, S, 2 + rand() * 3);
  }
  for (let i = 0; i < 10000; i++) { ctx.fillStyle = `rgba(255,255,255,${rand() * 0.04})`; ctx.fillRect(rand() * S, rand() * S, 1, 1); }

  // ═══ 2. TOP BAR ═══
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  let ltx = 60;
  for (const ch of "LEARNTUBE") { ctx.fillText(ch, ltx, 48); ltx += ctx.measureText(ch).width + 3; }

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 12px system-ui, -apple-system, sans-serif";
  const rLabel = "AI PROFICIENCY SCORE";
  let rlx = S - 60;
  for (let i = rLabel.length - 1; i >= 0; i--) { const ch = rLabel[i], cw = ctx.measureText(ch).width; ctx.fillText(ch, rlx - cw / 2, 48); rlx -= cw + 2.5; }

  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(S - 60, 70); ctx.stroke();

  // ═══ 3. GEM ═══
  const gemCy = 280, gemR = 200;

  // Glow behind gem
  const glowGrad = ctx.createRadialGradient(cx, gemCy + 20, 0, cx, gemCy + 20, gemR * 1.5);
  glowGrad.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)`);
  glowGrad.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`);
  glowGrad.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.03)`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, S, S);

  const outerPts = hexPts(cx, gemCy, gemR);
  const center = { x: cx, y: gemCy };

  // Gem body
  drawHex(outerPts);
  const gemBodyGrad = ctx.createLinearGradient(cx - gemR, gemCy - gemR, cx + gemR, gemCy + gemR);
  gemBodyGrad.addColorStop(0, t.gem[0]); gemBodyGrad.addColorStop(0.5, t.gem[1]); gemBodyGrad.addColorStop(1, t.gem[0]);
  ctx.fillStyle = gemBodyGrad; ctx.fill();

  // Facets with lighting
  for (let i = 0; i < 6; i++) {
    const p1 = outerPts[i], p2 = outerPts[(i + 1) % 6];
    ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
    const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
    const fg = ctx.createLinearGradient(center.x, center.y, midX, midY);
    if (i === 0 || i === 5) { fg.addColorStop(0, t.gem[2]); fg.addColorStop(0.5, t.gem[3]); fg.addColorStop(1, t.gem[4]); ctx.globalAlpha = 0.85; }
    else if (i === 1) { fg.addColorStop(0, t.gem[1]); fg.addColorStop(1, t.gem[3]); ctx.globalAlpha = 0.7; }
    else if (i === 2 || i === 3) { fg.addColorStop(0, t.gem[0]); fg.addColorStop(1, t.gem[1]); ctx.globalAlpha = 0.6; }
    else { fg.addColorStop(0, t.gem[1]); fg.addColorStop(1, t.gem[2]); ctx.globalAlpha = 0.65; }
    ctx.fillStyle = fg; ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Inner hex for depth
  const innerPts = hexPts(cx, gemCy, gemR * 0.55);
  drawHex(innerPts);
  const innerGrad = ctx.createRadialGradient(cx - 40, gemCy - 40, 0, cx, gemCy, gemR * 0.55);
  innerGrad.addColorStop(0, t.gem[3]); innerGrad.addColorStop(0.5, t.gem[2]); innerGrad.addColorStop(1, t.gem[1]);
  ctx.fillStyle = innerGrad; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;

  // Facet lines
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`; ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(innerPts[i].x, innerPts[i].y); ctx.lineTo(outerPts[i].x, outerPts[i].y); ctx.stroke(); }
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.25)`; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(outerPts[i].x, outerPts[i].y); ctx.stroke(); }

  // Rim light
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(outerPts[4].x, outerPts[4].y); ctx.lineTo(outerPts[5].x, outerPts[5].y); ctx.lineTo(outerPts[0].x, outerPts[0].y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(outerPts[0].x, outerPts[0].y); ctx.lineTo(outerPts[1].x, outerPts[1].y); ctx.stroke();

  // Outer border
  drawHex(outerPts);
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)`; ctx.lineWidth = 1.5; ctx.stroke();

  // Reflection line
  const reflY = gemCy + gemR + 12;
  const lineGr = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
  lineGr.addColorStop(0, "transparent"); lineGr.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
  lineGr.addColorStop(0.5, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`); lineGr.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
  lineGr.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGr; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(cx - 260, reflY); ctx.lineTo(cx + 260, reflY); ctx.stroke();

  // Sparkles
  _seed = level * 1000 + 42;
  const numSparkles = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < numSparkles; i++) {
    const sa = -Math.PI * 0.8 + rand() * Math.PI * 1.2, sd = gemR * 0.5 + rand() * gemR * 0.7;
    const sx = cx + Math.cos(sa) * sd, sy = gemCy + Math.sin(sa) * sd * 0.7, ssz = 8 + rand() * 14;
    ctx.save(); ctx.globalAlpha = 0.7 + rand() * 0.3;
    const spG = ctx.createRadialGradient(sx, sy, 0, sx, sy, ssz * 2);
    spG.addColorStop(0, "rgba(255,255,255,0.6)"); spG.addColorStop(0.3, `rgba(${sparkleRgb.r},${sparkleRgb.g},${sparkleRgb.b},0.3)`); spG.addColorStop(1, "transparent");
    ctx.fillStyle = spG; ctx.fillRect(sx - ssz * 2, sy - ssz * 2, ssz * 4, ssz * 4);
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx, sy - ssz); ctx.lineTo(sx, sy + ssz); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - ssz, sy); ctx.lineTo(sx + ssz, sy); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ═══ 4. CONTENT ON GEM — number + /6 ═══
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 20; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
  ctx.font = "900 170px system-ui, -apple-system, sans-serif";
  const levelMetrics = ctx.measureText(levelDisplay);
  const levelX = cx - 12;
  ctx.fillText(levelDisplay, levelX, gemCy + 20);

  ctx.font = "400 60px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.fillText("/ 6", levelX + levelMetrics.width / 2 + 10, gemCy + 18);

  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  // ═══ 5. BELOW GEM: Level name → Relationship → Stats ═══
  ctx.textAlign = "center";
  const levelNames = ["Non-User","Experimenter","Functional User","Effective Practitioner","AI-Native Performer","AI-Native Builder","Pioneer"];
  const nameY = gemCy + gemR + 40;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 20px system-ui, -apple-system, sans-serif";
  spacedText((levelNames[level] || levelNames[0]).toUpperCase(), cx, nameY, 3);

  // Relationship — bold identity hook
  if (relWord) {
    const relLabelY = nameY + 46;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 13px system-ui, -apple-system, sans-serif";
    spacedText("MY AI RELATIONSHIP", cx, relLabelY, 4);

    const relFontSize = relWord.length > 12 ? 56 : 64;
    ctx.font = `900 ${relFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = t.accent;
    const relWordY = relLabelY + 56;
    ctx.fillText(relWord, cx, relWordY);

    // Subtle glow behind word
    ctx.save();
    const tg = ctx.createRadialGradient(cx, relWordY, 0, cx, relWordY, 180);
    tg.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.06)`); tg.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = tg; ctx.fillRect(cx - 180, relWordY - 50, 360, 100);
    ctx.restore();
  }

  // Percentile / positioning line
  const pctDisplay = percentile || [95, 65, 34, 12, 5, 1][level] || 50;
  const pctY = relWord ? (nameY + 46 + 56 + 52) : (nameY + 60);
  ctx.font = "700 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  if (level <= 1) {
    ctx.fillText("Now I know where I stand — growth starts here", cx, pctY);
  } else {
    ctx.fillText(`Top ${pctDisplay}% of professionals assessed`, cx, pctY);
  }

  // Credibility zone
  const divY = pctY + 26;
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - 220, divY); ctx.lineTo(cx + 220, divY); ctx.stroke();

  const resY = divY + 24;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("Assessment built on research from", cx, resY);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 17px system-ui, -apple-system, sans-serif";
  ctx.fillText("BCG  ·  Anthropic  ·  MIT", cx, resY + 24);

  const compY = resY + 56;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("Professionals assessed from", cx, compY);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Meta  ·  Amazon  ·  TCS  ·  Deloitte  ·  Infosys  ·  and more", cx, compY + 20);

  // ═══ 6. BOTTOM — curiosity nudge + URL ═══
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "700 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("What’s your AI Level?", cx, S - 82);

  ctx.fillStyle = t.accent;
  ctx.font = "800 19px system-ui, -apple-system, sans-serif";
  ctx.fillText("Visit: ai-level.learntube.ai", cx, S - 52);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Free  ·  Under 10 min  ·  4M+ assessed", cx, S - 26);
}

// ─── Level Reveal ───────────────────────────────────────
function AnimatedNumber({ target, color, duration = 1200 }) {
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const display = String(target);

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
        setDone(true);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <div className="relative inline-block">
      <span
        className={`text-8xl font-extrabold transition-all duration-500 ${done ? "scale-100" : "scale-110"}`}
        style={{ color, filter: done ? `drop-shadow(0 0 60px ${color}50)` : "none", transition: "filter 1s ease-out" }}
      >
        {done ? display : current}
      </span>
      {done && (
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: color, animation: "pulse 2s ease-in-out 1" }}
        />
      )}
    </div>
  );
}

// ─── Expandable Section ──────────────────────────────────
function Expandable({ label, color, children }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="w-full text-left">
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-[10px] font-medium" style={{ color: color || "#94a3b8" }}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 text-gray-600 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="pb-3">{children}</div>
      </div>
    </button>
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
  { level: 6, name: "Pioneer", short: "Advances the frontier", tier: "Pioneer" },
];

// Two dimensions: Tier = how you treat AI, Status = your association pattern
const RELATIONSHIP_SCALE = [
  { key: "single", label: "Single", tierLabel: "Pre-Tool", short: "AI isn't part of your life yet" },
  { key: "casual", label: "Casual", tierLabel: "AI as Tool", short: "You pick it up and put it down" },
  { key: "committed", label: "Committed", tierLabel: "AI as Colleague", short: "Real working relationship" },
  { key: "merged", label: "Merged", tierLabel: "AI as Symbiont", short: "Thinking is intertwined" },
  { key: "complicated", label: "It's Complicated", tierLabel: "Mixed signals", short: "Strong in some areas, dependent in others" },
];

// ─── Insight Engine for Beat 2 ──────────────────────────
function getStrengthInsight(scores, level) {
  if (scores.item3Correct && scores.item3bCorrect) return { icon: "🎯", label: "Double vision", text: "You saw through both the Artifact Effect and the Agreement Trap. That combination puts you ahead of 80%+ of test-takers." };
  if (scores.item3Correct) return { icon: "👁", label: "You see through polish", text: "You caught the Artifact Effect — AI's most common trick. Most people default to the professional-looking response. You didn't." };
  if (scores.item4Choice === "C" || scores.item4Choice === "D") return { icon: "🧠", label: "Strategic iterator", text: "When AI gave you a generic framework, you pushed back on the substance — not just the format. That's the skill gap between L2 and L3." };
  if (scores.restraintScore >= 2) return { icon: "🛡", label: "Restraint is a skill", text: "You knew when NOT to use AI. Apologies need your voice. Allergies need verified safety. You got both." };
  if (scores.item2Correct >= 3) return { icon: "🔬", label: "Calibration instinct", text: "You understand where AI shines and where it breaks. That boundary awareness is rarer than it sounds." };
  if (scores.behavFreqScore >= 3) return { icon: "🔄", label: "Mature habits", text: "Your day-to-day AI habits show maturity. You've moved past experimenting into consistent, intentional use." };
  return { icon: "✦", label: "You showed up", text: "Taking this assessment puts you ahead of 95% of people who talk about AI but never measure it." };
}

function getBlindSpotInsight(scores, level) {
  if (!scores.item3Correct && scores.item4Choice === "A") return { icon: "⚠", label: "The polish-and-accept trap", text: "AI fooled you with polish (Artifact Effect), and when its output was 80% there, you accepted it as-is. The fix: before using any AI output, ask 'is this actually saying something specific?'" };
  if (!scores.item3Correct) return { icon: "⚠", label: "The Artifact Effect got you", text: "You picked the polished response over the useful one. AI's formatting tricks your brain into trusting it. This is the #1 skill gap between L2 and L3." };
  if (scores.item3bCorrect === false && scores.item3Correct) return { icon: "⚠", label: "The yes-man slipped past", text: "You caught the Artifact Effect but missed the Agreement Trap. When AI agrees with you too easily, that's exactly when you should push hardest." };
  if (scores.item4Choice === "A" || scores.item4Choice === "B") return { icon: "⚠", label: "Format over substance", text: "When AI gave you an 80% draft, you polished the container instead of challenging the reasoning. The question isn't 'how does this look?' — it's 'is the logic right?'" };
  if (scores.restraintScore < 2) return { icon: "⚠", label: "No restraint boundary", text: "You'd use AI for an apology and for allergy recipes. Some tasks need your real voice. Others need verified safety. Knowing when to say 'not this one' is an underrated skill." };
  if (scores.item6Level <= 2) return { icon: "⚠", label: "Surface-level follow-up", text: "When AI gave you a generic analysis, your follow-up stayed surface-level. The high-value move: challenge the analysis itself, not just ask for more detail." };
  return { icon: "💡", label: "Room to explore", text: "Your assessment didn't flag major blind spots — but the quick test only covers 5 of 8 abilities. The full certification reveals the subtler patterns." };
}

function getGapDescription(level) {
  const gaps = {
    0: { you: "Haven't started using AI", next: "Can identify generic vs. specific AI output. Gives context in prompts. Building an AI vocabulary.", nextLevel: 1 },
    1: { you: "Experimenting, finding your footing", next: "Gets consistent daily value. Picks the right tool for the job. Iterates on outputs instead of accepting the first draft.", nextLevel: 2 },
    2: { you: "Getting real value from AI tools", next: "Sees through polished output. Challenges AI reasoning. Knows when AI should NOT be used. Evaluation instinct.", nextLevel: 3 },
    3: { you: "Real judgment with AI", next: "Designs workflows where AI handles the right steps. Builds reusable patterns.", nextLevel: 4 },
    4: { you: "AI is how you work", next: "Builds systems others use. Creates automation pipelines and team workflows.", nextLevel: 5 },
    5: { you: "Builds AI systems", next: "Advancing the practice itself — pushing the frontier of what's possible. L6 isn't reachable in this assessment.", nextLevel: 6 },
    6: { you: "Pioneer — advancing the frontier", next: null, nextLevel: null },
  };
  return gaps[Math.min(level, 6)];
}

function LevelReveal({ level, scores, insights, relationshipStatus, selfSelectedLevel, persona, role, company, path }) {
  const [stage, setStage] = useState(0);
  const [shareState, setShareState] = useState("idle");
  const [proveReserved, setProveReserved] = useState(false);
  const [improveReserved, setImproveReserved] = useState(false);
  const [challengeSent, setChallengeSent] = useState(false);
  const [challengeLink, setChallengeLink] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showLevelScale, setShowLevelScale] = useState(false);
  const [showRelScale, setShowRelScale] = useState(false);
  const canvasRef = useRef(null);
  const beat2Ref = useRef(null);
  const data = LEVEL_DATA[level] || LEVEL_DATA[4];
  const relData = RELATIONSHIP_DATA[relationshipStatus] || RELATIONSHIP_DATA.casual;
  const percentile = getPercentile(level);
  const phase = getPhase(level);
  const phaseData = PHASES[phase];
  const perceptionGap = selfSelectedLevel !== null ? selfSelectedLevel - level : null;
  const strength = getStrengthInsight(scores, level);
  const blindSpot = getBlindSpotInsight(scores, level);
  const gapData = getGapDescription(level);
  const isManager = persona === "manager" || (role && /\b(lead|manag|director|head|vp|chief|founder|ceo|cto)\b/i.test(role));

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 800);
    const t3 = setTimeout(() => setStage(3), 1800);
    const t4 = setTimeout(() => setStage(4), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Render share card
  useEffect(() => {
    if (stage >= 2 && canvasRef.current) {
      renderShareCard(canvasRef.current, level, data, relData, percentile, phaseData, selfSelectedLevel, scores);
    }
  }, [stage, level]);

  // Scroll hint — show after share CTA appears, dismiss on scroll
  useEffect(() => {
    if (stage >= 2) {
      const t = setTimeout(() => setShowScrollHint(true), 1200);
      const dismiss = () => setShowScrollHint(false);
      window.addEventListener("scroll", dismiss, { once: true, passive: true });
      return () => { clearTimeout(t); window.removeEventListener("scroll", dismiss); };
    }
  }, [stage]);

  // Auto-scroll to Beat 2 after sharing
  useEffect(() => {
    if (shareState === "shared" && beat2Ref.current) {
      setTimeout(() => beat2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 1000);
    }
  }, [shareState]);

  // Build share text — frame every level as share-worthy
  const shareLines = [];
  // Line 1: Level announcement (always)
  shareLines.push(`${phaseData.emoji} AI Level ${level}/6 — ${data.name}`);
  // Line 2: Context varies by level
  if (level <= 1) {
    // Low levels: frame as self-awareness / starting point
    shareLines.push(`Most people don't measure this. Now I know exactly where I stand — and where the growth is.`);
  } else if (perceptionGap !== null && perceptionGap < 0) {
    shareLines.push(`I thought I was Level ${selfSelectedLevel}. Turns out I'm Level ${level}. Better than I expected.`);
  } else if (perceptionGap === 0) {
    shareLines.push(`Perfect calibration — I guessed my exact level. Only 12% get this right.`);
  } else if (level === 2) {
    shareLines.push(`Getting real value from AI — but the assessment showed me the blind spots I didn't see.`);
  }
  // Line 3: Percentile (show for all — it contextualizes)
  if (percentile <= 35) {
    shareLines.push(`Top ${percentile}% of professionals assessed.`);
  } else if (level <= 2) {
    shareLines.push(`${100 - percentile}% have started their AI journey. Where are you?`);
  }
  // Line 4: Relationship (only if aspirational)
  if (relationshipStatus === "merged" || relationshipStatus === "committed") {
    shareLines.push(`AI Relationship: ${relData.emoji} ${relData.status}`);
  }
  // CTA
  shareLines.push(`\nWhat's yours? → https://${BRAND_CONFIG.share_url}`);
  if (BRAND_CONFIG.share_hashtag) shareLines.push(BRAND_CONFIG.share_hashtag);
  const shareText = shareLines.join("\n");

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) { setShareState("idle"); return; }
    setShareState("sharing");
    renderShareCard(canvas, level, data, relData, percentile, phaseData, selfSelectedLevel, scores);

    if (navigator.share && navigator.canShare) {
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        if (blob) {
          const file = new File([blob], `ai-level-${level}.png`, { type: "image/png" });
          const shareData = { text: shareText, files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setShareState("shared");
            return;
          }
        }
      } catch (e) {
        if (e.name === "AbortError") { setShareState("idle"); return; }
        // Fall through to next share method
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: "https://ai-level.learntube.ai" });
        setShareState("shared");
        return;
      } catch (e) {
        if (e.name === "AbortError") { setShareState("idle"); return; }
        // Fall through to download fallback
      }
    }
    // Fallback: download card + copy text
    const link = document.createElement("a");
    link.download = `ai-level-${level}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    try { if (navigator.clipboard) await navigator.clipboard.writeText(shareText); } catch (_) {}
    setShareState("fallback");
    setTimeout(() => setShareState("idle"), 5000);
  };

  const handleReserve = (type) => {
    const lead = window.__aiLevelLead || {};
    if (type === "prove") setProveReserved(true);
    if (type === "improve") setImproveReserved(true);
    window.__aiLevelIntent = { ...(window.__aiLevelIntent || {}), [type]: true, lead, level, relationshipStatus, timestamp: Date.now() };
  };

  const handleChallenge = (method) => {
    const fullUrl = `https://${BRAND_CONFIG.share_url}`;
    const text = isManager
      ? (level >= 3
          ? `I just tested my AI skills — scored Level ${level} (${data.name}). How does our team compare? Take it: ${fullUrl}`
          : `I tested my team's AI readiness starting with myself. Interesting results. Take the 5-min test: ${fullUrl}`)
      : (level >= 3
          ? `I'm AI Level ${level} (Top ${percentile}%). Think you can beat me? → ${fullUrl}`
          : `Just found out my real AI level. Not what I expected. What's yours? → ${fullUrl}`);

    if (method === "copy") {
      try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (_) {}
      setChallengeLink(true);
      setTimeout(() => setChallengeLink(false), 3000);
    } else if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 5000);
    } else if (method === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, "_blank");
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 5000);
    } else if (method === "email") {
      const subject = isManager ? `AI Level Assessment — Team Challenge` : `Can you beat my AI Level?`;
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, "_blank");
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 5000);
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-5 py-8 relative overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" style={{ display: "none" }} />

        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-opacity duration-[2000ms]"
          style={{ backgroundColor: data.color, opacity: stage >= 1 ? 0.12 : 0 }}
        />

        <div className="max-w-sm w-full relative z-10">

          {/* ═══════════════════════════════════════════════════════
               BEAT 1: THE REVEAL — Level + Perception Gap + Share
               Psychology: peak emotion → capture impulse to share
             ═══════════════════════════════════════════════════════ */}

          {/* Header */}
          <div className={`text-center transition-all duration-500 ${stage >= 0 ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-blue-400 text-[10px] font-bold tracking-wider">LEARNTUBE</span>
              <span className="text-gray-700 text-[10px]">|</span>
              <span className="text-gray-500 text-[10px] tracking-wider">AI LEVEL</span>
            </div>
          </div>

          {/* The number */}
          <div className={`text-center transition-all duration-700 ${stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
            {stage >= 1 && <AnimatedNumber target={level} color={data.color} />}
          </div>

          {/* Name + tagline + phase */}
          <div className={`text-center transition-all duration-700 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="text-xl font-bold text-white mb-1">{data.name}</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-3 max-w-xs mx-auto">{data.tagline}</p>

            {/* Phase + Percentile + Relationship — single compact row */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
              <button onClick={() => setShowLevelScale(!showLevelScale)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer" style={{ backgroundColor: `${phaseData.color}15`, border: `1px solid ${showLevelScale ? phaseData.color : `${phaseData.color}30`}` }}>
                <span className="text-xs">{phaseData.emoji}</span>
                <span className="text-[11px] font-semibold" style={{ color: phaseData.color }}>{phaseData.name}</span>
                <span className="text-[9px] text-gray-500 ml-0.5">{showLevelScale ? "▲" : "▼"}</span>
              </button>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className="text-gray-400 text-[11px]">{percentile <= 50 ? <>Top <span className="text-white font-semibold">{percentile}%</span></> : <><span className="text-white font-semibold">{percentile}%</span> of test-takers</>}</span>
              <span className="text-gray-700 text-[10px]">·</span>
              <button onClick={() => setShowRelScale(!showRelScale)} className="text-[11px] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer rounded-full px-2 py-0.5" style={{ border: showRelScale ? `1px solid ${relData.color}40` : "1px solid transparent" }}>
                {relData.emoji} <span style={{ color: relData.color }}>{relData.status}</span>
                <span className="text-[9px] text-gray-500 ml-0.5">{showRelScale ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* Level Scale — progressive disclosure */}
            <div className={`overflow-hidden transition-all duration-400 ease-out ${showLevelScale ? "max-h-[400px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-3 mt-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2.5 text-center">The 7 Levels of AI Readiness</p>
                <div className="space-y-1">
                  {LEVEL_SCALE.map((l) => (
                    <div key={l.level} className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-all ${l.level === level ? "bg-white/5 border border-white/10" : ""}`}>
                      <span className={`text-xs font-bold w-5 text-center ${l.level === level ? "text-white" : "text-gray-600"}`}>L{l.level}</span>
                      <span className={`text-[11px] flex-1 ${l.level === level ? "text-white font-medium" : "text-gray-500"}`}>{l.name}</span>
                      <span className={`text-[10px] ${l.level === level ? "text-gray-300" : "text-gray-700"}`}>{l.short}</span>
                      {l.level === level && <span className="text-[10px]" style={{ color: data.color }}>← You</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Relationship Scale — progressive disclosure */}
            <div className={`overflow-hidden transition-all duration-400 ease-out ${showRelScale ? "max-h-[350px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-3 mt-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2.5 text-center">Your Relationship with AI</p>
                <div className="space-y-1">
                  {RELATIONSHIP_SCALE.map((r) => {
                    const isCurrent = r.label === relData.status || r.key === relationshipStatus;
                    const rColor = RELATIONSHIP_DATA[r.key]?.color || "#94a3b8";
                    return (
                      <div key={r.key} className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-all ${isCurrent ? "bg-white/5 border border-white/10" : ""}`}>
                        <span className="text-xs">{RELATIONSHIP_DATA[r.key]?.emoji || "·"}</span>
                        <span className={`text-[11px] font-medium ${isCurrent ? "text-white" : "text-gray-500"}`} style={isCurrent ? { color: rColor } : {}}>{r.label}</span>
                        <span className={`text-[10px] flex-1 text-right ${isCurrent ? "text-gray-300" : "text-gray-700"}`}>{r.short}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Perception Gap — THE most shareable moment */}
            {perceptionGap !== null && (
              <div className={`rounded-2xl px-5 py-4 mb-4 border ${
                perceptionGap > 0
                  ? "bg-amber-500/5 border-amber-500/20"
                  : perceptionGap === 0
                    ? "bg-blue-500/5 border-blue-500/20"
                    : "bg-emerald-500/5 border-emerald-500/20"
              }`}>
                {perceptionGap !== 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-5 mb-2">
                      <div className="text-center">
                        <p className="text-gray-600 text-[11px] uppercase tracking-wider mb-0.5">You said</p>
                        <p className="text-xl font-medium text-gray-600">L{selfSelectedLevel}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={`text-2xl ${perceptionGap > 0 ? "text-amber-400" : "text-emerald-400"}`}>→</span>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-[11px] uppercase tracking-wider mb-0.5">Actual</p>
                        <p className="text-3xl font-extrabold" style={{ color: data.color }}>L{level}</p>
                      </div>
                    </div>
                    <p className={`text-xs font-medium text-center ${perceptionGap > 0 ? "text-amber-400/90" : "text-emerald-400/90"}`}>
                      {perceptionGap > 0
                        ? `${perceptionGap}-level gap — ${perceptionGap >= 2 ? "most people overestimate by 2+ levels" : "slightly optimistic"}`
                        : `${Math.abs(perceptionGap)} level${Math.abs(perceptionGap) > 1 ? "s" : ""} better than you thought`}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-blue-400 text-xs font-bold mb-0.5">🎯 Perfect calibration</p>
                    <p className="text-gray-400 text-[11px]">You said L{selfSelectedLevel} — and that's exactly right. Only 12% of people nail this.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── SHARE CTA — primary, unmissable ─── */}
            <div className={`transition-all duration-500 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
              <button
                onClick={handleShare}
                disabled={shareState === "sharing"}
                aria-label="Share your AI Level score on LinkedIn"
                className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 mb-2 ${
                  shareState === "shared"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : shareState === "fallback"
                      ? "bg-emerald-500/80 text-white"
                      : "bg-white text-gray-950 hover:scale-[1.02] active:scale-[0.97] shadow-xl shadow-white/15"
                }`}
              >
                {shareState === "idle" && (
                  level >= 4
                    ? "Share your AI Level →"
                    : perceptionGap !== null && perceptionGap < 0
                      ? "Share — you scored higher than expected →"
                      : perceptionGap === 0
                        ? "Share your perfect calibration →"
                        : level >= 2
                          ? "Show LinkedIn your AI Level →"
                          : "Share your AI Level →"
                )}
                {shareState === "sharing" && "Preparing your card..."}
                {shareState === "shared" && "Posted! Nice."}
                {shareState === "fallback" && "Card saved + caption copied!"}
              </button>
              <p className="text-gray-600 text-[10px] text-center mb-1">
                {shareState === "shared" || shareState === "fallback"
                  ? "Scroll down to see what your score reveals ↓"
                  : "Your card is ready — looks great in-feed"}
              </p>
            </div>
          </div>

          {/* Scroll hint */}
          {showScrollHint && (
            <div className="flex justify-center mt-6 animate-bounce">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-600">
                <path d="M10 4L10 16M10 16L5 11M10 16L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
               BEAT 2: THE MIRROR — Strength, Blind Spot, Gap
               Psychology: pride + curiosity, NO CTA — builds desire
             ═══════════════════════════════════════════════════════ */}

          <div ref={beat2Ref} className={`transition-all duration-700 mt-10 ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-800/40" />
              <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">Your profile</span>
              <div className="flex-1 h-px bg-gray-800/40" />
            </div>

            {/* Strength card */}
            <div className="rounded-2xl bg-teal-500/5 border border-teal-500/15 px-5 py-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{strength.icon}</span>
                <span className="text-teal-400 text-[11px] font-bold tracking-wide uppercase">{strength.label}</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{strength.text}</p>
            </div>

            {/* Blind spot card */}
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 px-5 py-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{blindSpot.icon}</span>
                <span className="text-amber-400 text-[11px] font-bold tracking-wide uppercase">{blindSpot.label}</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{blindSpot.text}</p>
            </div>

            {/* Gap comparison card — two columns */}
            {level < 6 && gapData && gapData.nextLevel && (
              <div className="rounded-2xl border border-gray-800/30 overflow-hidden mb-3">
                <div className="bg-gray-900/60 px-5 py-3 border-b border-gray-800/20">
                  <p className="text-gray-400 text-[11px] font-semibold tracking-wider uppercase">The gap to L{gapData.nextLevel}</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-800/20">
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="text-gray-500 text-[11px] font-semibold uppercase">You (L{level})</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{gapData.you}</p>
                  </div>
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_DATA[gapData.nextLevel]?.color || "#60a5fa" }} />
                      <span className="text-[11px] font-semibold uppercase" style={{ color: LEVEL_DATA[gapData.nextLevel]?.color || "#60a5fa" }}>L{gapData.nextLevel} can</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{gapData.next}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
               BEAT 3: THE CHALLENGE — Context-adaptive invite
               Psychology: competition, social comparison, FOMO
             ═══════════════════════════════════════════════════════ */}

          <div className={`transition-all duration-700 mt-10 ${stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-800/40" />
              <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">Challenge</span>
              <div className="flex-1 h-px bg-gray-800/40" />
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 pt-5 pb-4 mb-3">
              {/* Challenge card visual */}
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Your score */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1.5" style={{ backgroundColor: `${data.color}15`, border: `2px solid ${data.color}40` }}>
                    <span className="text-2xl font-extrabold" style={{ color: data.color }}>L{level}</span>
                  </div>
                  <p className="text-gray-400 text-[10px]">You</p>
                </div>
                {/* VS */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-gray-600 text-lg font-bold">vs</span>
                </div>
                {/* Empty challenger slot */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-1.5 bg-gray-900/40 animate-pulse">
                    <span className="text-gray-500 text-xl">?</span>
                  </div>
                  <p className="text-gray-500 text-[10px]">
                    {isManager ? "Your team" : "A friend"}
                  </p>
                </div>
              </div>

              {/* Context-adaptive headline */}
              <p className="text-white text-sm font-bold text-center mb-1">
                {isManager && company
                  ? `Where does ${company} stand?`
                  : isManager
                    ? "How AI-ready is your team?"
                  : level >= 4
                    ? `Only ${percentile}% score this high.`
                  : level >= 2
                    ? "How do you compare to your circle?"
                    : "Find out who's actually ahead."
                }
              </p>
              <p className="text-gray-400 text-xs text-center mb-4 leading-relaxed">
                {isManager
                  ? (level >= 4
                      ? "You're ahead of most. Find out if your team is keeping up."
                      : "Most teams overestimate their AI skills by 2 levels. Send the test and see the real data.")
                  : level >= 3
                    ? `You scored top ${percentile}%. Most people you know probably overestimate by 2 levels.`
                    : "Most people think they're better than they are. Send this and find out."}
              </p>

              {/* Share methods — horizontal buttons */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={() => handleChallenge("whatsapp")}
                  className="py-3 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-semibold transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
                  aria-label="Challenge via WhatsApp"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => handleChallenge("linkedin")}
                  className="py-3 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-semibold transition-all hover:bg-blue-500/25 active:scale-[0.97]"
                  aria-label="Challenge via LinkedIn"
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => handleChallenge("email")}
                  className="py-3 rounded-xl bg-purple-500/15 text-purple-400 text-xs font-semibold transition-all hover:bg-purple-500/25 active:scale-[0.97]"
                  aria-label="Challenge via Email"
                >
                  Email
                </button>
              </div>
              <button
                onClick={() => handleChallenge("copy")}
                aria-label="Copy challenge link to clipboard"
                className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all ${
                  challengeLink
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-gray-800/40 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60"
                }`}
              >
                {challengeLink ? "Link copied!" : "Copy challenge link"}
              </button>
              {challengeSent && (
                <p className="text-emerald-400/70 text-[10px] text-center mt-2 animate-pulse">Challenge sent! See who beats you when they share back.</p>
              )}
            </div>

            {isManager && (
              <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] overflow-hidden mb-3 mt-3">
                {/* Locked team report preview */}
                <div className="px-4 pt-4 pb-3">
                  <p className="text-[10px] uppercase tracking-widest text-blue-400/70 font-semibold mb-3 text-center">Team AI Report — Preview</p>
                  {/* Blurred/locked report mockup */}
                  <div className="relative rounded-xl border border-gray-800/30 bg-gray-900/60 p-3 overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-gray-950/30 z-10 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-lg">🔒</span>
                        <p className="text-white text-[11px] font-semibold mt-1">Unlocks when 3+ team members complete</p>
                      </div>
                    </div>
                    {/* Fake report content (visible but blurred behind) */}
                    <div className="opacity-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-[10px]">Team avg: L—</span>
                        <span className="text-gray-500 text-[10px]">You: L{level}</span>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 h-6 rounded bg-gray-800/60" />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-[10px]">Perception gaps</span>
                        <span className="text-gray-600 text-[10px]">Skill distribution</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-[11px] text-center mt-3 leading-relaxed">
                    {level >= 4
                      ? "See who's keeping up with you — and who needs support."
                      : "See how your team compares to you — and to each other."}
                  </p>
                </div>
                <button
                  onClick={() => handleChallenge("copy")}
                  className="w-full py-3 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 transition-all active:scale-[0.98]"
                >
                  Send your team the assessment →
                </button>

                {/* Enterprise consulting — gated booking */}
                <div className="border-t border-gray-800/20 px-4 py-3">
                  <p className="text-gray-500 text-[11px] text-center leading-relaxed">
                    Want a full org-wide AI readiness program?{" "}
                    <button
                      onClick={() => {
                        const lead = window.__aiLevelLead || {};
                        const teamSize = prompt("How many people on your team?");
                        if (!teamSize) return;
                        const goal = prompt("What would you use a team AI report for? (e.g., training budget, hiring, upskilling)");
                        if (!goal) return;
                        window.__aiLevelIntent = { ...(window.__aiLevelIntent || {}), enterprise: true, lead, level, teamSize, goal, company, timestamp: Date.now() };
                        window.open(`https://calendly.com/shronit/ai-readiness?name=${encodeURIComponent(lead.name || "")}&email=${encodeURIComponent(lead.email || "")}&a1=${encodeURIComponent(company || "")}&a2=${encodeURIComponent(teamSize)}&a3=${encodeURIComponent(goal)}`, "_blank");
                      }}
                      className="text-blue-400 font-semibold underline underline-offset-2"
                    >
                      Book a strategy slot →
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                 BEAT 4: THE PATH FORWARD — Gap-specific paid CTAs
                 Psychology: aspiration built by Beats 2 & 3
               ═══════════════════════════════════════════════════════ */}

            <div className="flex items-center gap-3 mb-5 mt-6">
              <div className="flex-1 h-px bg-gray-800/40" />
              <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">What's next</span>
              <div className="flex-1 h-px bg-gray-800/40" />
            </div>

            {/* Certification CTA — the ONE hero action */}
            <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: `${data.color}30`, background: `linear-gradient(135deg, ${data.color}08, transparent)` }}>
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${data.color}15` }}>
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Get your certified AI Level</p>
                    <p className="text-gray-600 text-[10px]">Full 8-ability assessment + LinkedIn badge</p>
                  </div>
                </div>

                {/* Mini certificate preview */}
                <div className="rounded-xl border border-gray-800/30 bg-gray-900/60 p-3 mb-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${data.color}15`, border: `1px solid ${data.color}30` }}>
                    <span className="text-lg font-extrabold" style={{ color: data.color }}>L{level}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-[11px] font-semibold truncate">Certified AI Level {level} — {data.name}</p>
                    <p className="text-gray-600 text-[11px]">LearnTube · Verified Assessment · 2026</p>
                    <p className="text-[11px] mt-0.5" style={{ color: data.color }}>This is how it looks on LinkedIn →</p>
                  </div>
                </div>

                <p className="text-gray-400 text-xs leading-relaxed mb-3">
                  {level === 0
                    ? <>This quick test gives you a baseline. The full certification <span className="text-white font-medium">maps exactly where to start</span> — so you build the right skills from day one, not random ones.</>
                  : level <= 2
                    ? <>This quick test covered 5 of 8 abilities. The full certification <span className="text-white font-medium">proves you're building the right skills</span> — before your company asks who's AI-ready and who isn't.</>
                  : level <= 3
                    ? <>The quick test flagged a pattern. The full assessment <span className="text-white font-medium">maps all 8 abilities</span> so you know exactly where your judgment is sharp — and where it's not.</>
                  : level <= 5
                    ? <>You scored high here. The full assessment <span className="text-white font-medium">unlocks L4–L5 depth scoring</span> — the quick test can't measure system design or frontier contribution.</>
                    : <>You hit the ceiling on the quick test. The full assessment <span className="text-white font-medium">verifies L5 across all 8 abilities</span> — and gives you a credential that proves it.</>
                  }
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-[10px] font-semibold">Waitlist open — filling fast</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleReserve("prove")}
                disabled={proveReserved}
                className={`w-full py-3.5 text-sm font-bold transition-all duration-300 ${
                  proveReserved
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "hover:brightness-110 active:scale-[0.98]"
                }`}
                style={!proveReserved ? { backgroundColor: `${data.color}20`, color: data.color } : {}}
              >
                {proveReserved ? "✓ You're on the list" : "Get certified →"}
              </button>
            </div>

            {/* Learning path — compact secondary tile */}
            <div className={`rounded-xl border overflow-hidden mb-4 transition-all duration-300 ${
              improveReserved ? "border-emerald-500/20 bg-emerald-500/5" : "border-gray-800/30 bg-gray-900/40 hover:border-gray-700/40"
            }`}>
              <button
                onClick={() => handleReserve("improve")}
                disabled={improveReserved}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 flex-shrink-0">
                  <span className="text-sm">{level >= 6 ? "⚡" : "🚀"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold mb-0.5 ${improveReserved ? "text-emerald-400" : "text-white"}`}>
                    {improveReserved ? "✓ You're on the list" : level >= 6 ? "Frontier track — advanced applications" : `Go from L${level} → L${Math.min(level + 1, 6)}`}
                  </p>
                  <p className="text-gray-500 text-[11px] leading-snug">
                    {improveReserved
                      ? "We'll notify you when it launches"
                      : level === 0
                        ? "Start from zero — learn what AI can actually do for your work"
                      : level <= 2
                        ? "Guided exercises built from your assessment results"
                      : level <= 3
                        ? `Target your ${blindSpot.label.toLowerCase()} with project-based learning`
                      : level <= 5
                        ? "System-building track — from individual skill to team impact"
                        : "Multi-agent orchestration, custom tooling, and frontier research applications"
                    }
                  </p>
                </div>
                {!improveReserved && <span className="text-emerald-400/60 text-xs flex-shrink-0">→</span>}
              </button>
            </div>

            {/* ─── Footer ─── */}
            <div className="pt-5 mt-4 border-t border-gray-800/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2.5">
                <span className="text-blue-400 text-[10px] font-bold tracking-wider">{BRAND_CONFIG.host.name.toUpperCase()}</span>
                {BRAND_CONFIG.partner ? (
                  <>
                    <span className="text-gray-700 text-[10px]">×</span>
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: BRAND_CONFIG.partner.color || "#a78bfa" }}>{BRAND_CONFIG.partner.name.toUpperCase()}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-700 text-[10px]">|</span>
                    <span className="text-gray-500 text-[10px]">{BRAND_CONFIG.host.tagline}</span>
                  </>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-gray-800/30 border border-gray-800/40 mb-1.5">
                <span className="text-gray-400 text-[10px]">Framework built on research from</span>
                <span className="text-gray-300 text-[10px] font-semibold">BCG · Anthropic · MIT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

// ─── Generate Insights ──────────────────────────────────
function generateInsights(scores, level, selfSelectedLevel) {
  const ins = [];
  const phase = getPhase(level);
  const phaseData = PHASES[phase];

  // ── Perception Gap (the most valuable single data point) ──
  if (selfSelectedLevel !== null && selfSelectedLevel !== undefined) {
    const gap = selfSelectedLevel - level;
    if (gap >= 2) {
      ins.push({ label: "Your perception gap", text: `You rated yourself Level ${selfSelectedLevel} — your actual score is Level ${level}. That's a ${gap}-level overconfidence gap. This isn't unusual: ${gap >= 3 ? "most people overestimate by 2-3 levels" : "small overestimation is common"}. The gap itself is the most useful data point here.`, highlight: true });
    } else if (gap === 1) {
      ins.push({ label: "Your perception gap", text: `You rated yourself Level ${selfSelectedLevel}, scored Level ${level}. A 1-level gap — slightly optimistic, but your self-awareness is better than most.`, highlight: false });
    } else if (gap === 0) {
      ins.push({ label: "Self-awareness: calibrated", text: `You rated yourself Level ${selfSelectedLevel} — and that's exactly where you scored. Accurate self-assessment is itself a signal of AI maturity.`, highlight: false });
    } else {
      ins.push({ label: "You're underestimating yourself", text: `You rated yourself Level ${selfSelectedLevel} but scored Level ${level}. You're ${Math.abs(gap)} level${Math.abs(gap) > 1 ? "s" : ""} better than you think. Impostor syndrome is real — your actual skills are ahead of your self-image.`, highlight: false });
    }
  }

  // ── Phase insight ──
  ins.push({ label: `Phase: ${phaseData.emoji} ${phaseData.name}`, text: phaseData.description + (phase < 3 ? ` Most people are stuck in Phase ${phase}. The jump to Phase ${phase + 1} requires a fundamental shift in how you think about AI.` : " You've made the fundamental shifts most people never make.") });

  // ── Evaluation instinct ──
  if (scores.item3Correct) {
    ins.push({ label: "Your evaluation instinct", text: "You saw through the Artifact Effect when most people don't. You judge output by substance, not polish." });
  } else if (scores.item2Correct >= 3) {
    ins.push({ label: "Your calibration", text: "You know AI's boundary — where it shines and where it breaks. That's rarer than it sounds." });
  } else {
    ins.push({ label: "Your starting point", text: "You're early in understanding what AI can and can't do. That's normal — and the fastest skill to build." });
  }

  // ── Agreement Trap insight ──
  if (scores.item3bCorrect === false && scores.item3Correct) {
    ins.push({ label: "Blind spot: the yes-man", text: "You caught the Artifact Effect but missed the Agreement Trap. AI validated a flawed premise and you accepted it. When AI agrees with you too easily, that's when you should push hardest." });
  } else if (!scores.item3bCorrect && !scores.item3Correct) {
    ins.push({ label: "Your biggest gap", text: "AI fooled you twice — once with polish (Artifact Effect) and once with agreement (Agreement Trap). Both work the same way: they feel like validation. The fix is the same: ask 'is this actually challenging my thinking?'" });
  }

  // ── Biggest gap (if not already covered) ──
  if (scores.item3Correct && scores.item3bCorrect) {
    if (scores.item4Choice === "B" || scores.item4Choice === "A") {
      ins.push({ label: "Your iteration pattern", text: "When AI's output was 80% there, you focused on format instead of substance. The question isn't 'how does this look?' — it's 'is the reasoning right?'" });
    } else if (scores.restraintScore < 2) {
      ins.push({ label: "Your delegation gap", text: "You're tempted to use AI everywhere. But knowing when NOT to use it is just as important as knowing when to." });
    } else {
      ins.push({ label: "Your edge", text: "No major gaps in the quick assessment. The detailed breakdown would reveal the subtler patterns." });
    }
  }

  // ── Bridge to next level ──
  const bridges = {
    0: "Start by trying AI for one writing task this week. Just one. See what happens.",
    1: "Try giving ChatGPT more context — who you are, what you need, and what good looks like. That's the bridge.",
    2: "When AI gives you something that looks good, ask: 'Is this actually saying something specific?' That question changes everything.",
    3: "You have the judgment. Now build it into a system — workflows where AI handles the right steps and you handle the rest.",
    4: "You're at the frontier. The next step is building systems that uplift others — and pushing the boundary of what's possible.",
    5: "You build systems that make others better. The next frontier: advancing what AI itself can do. L6 isn't reachable in this assessment — it requires demonstrated frontier work.",
    6: "You're advancing the frontier itself. The practice evolves because of people like you.",
  };
  ins.push({ label: level < 6 ? "The bridge to next level" : "What's next", text: bridges[Math.min(level, 6)] });

  return ins;
}

// ─── Main App ───────────────────────────────────────────
export default function AILevel() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [history, setHistory] = useState([]);
  const [path, setPath] = useState(null); // null until determined after AIDiet
  const [selfSelectedLevel, setSelfSelectedLevel] = useState(null);
  const [persona, setPersona] = useState(null);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [behavFreqChoices, setBehavFreqChoices] = useState({});
  const [dietLevel, setDietLevel] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedUseCases, setSelectedUseCases] = useState([]);
  const [partnerAnswers, setPartnerAnswers] = useState({});
  const [item6Text, setItem6Text] = useState("");
  const [scores, setScores] = useState({
    a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, b1: 0,
    item3Correct: false, item3bCorrect: false,
    item4Choice: null, item6Level: 1,
    item2Correct: 0, restraintScore: 0,
    apologyAnswer: null, allergyAnswer: null, promptLevel: 1,
    behavFreqScore: 0, dietScore: 0, featureDepthScore: 0,
    workflowScore: 0, systemBuilderScore: 0,
  });
  const scoresRef = useRef(scores);
  scoresRef.current = scores;

  // Navigation with history tracking + score snapshots for undo
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [scoreSnapshots, setScoreSnapshots] = useState([]);

  const navigate = useCallback((next) => {
    setHistory(prev => [...prev, screenRef.current]);
    setScoreSnapshots(prev => [...prev, { ...scoresRef.current }]);
    setScreen(next);
  }, []);

  const goBack = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setScreen(prev);
      return h.slice(0, -1);
    });
    setScoreSnapshots(snaps => {
      if (snaps.length === 0) return snaps;
      const prevScores = snaps[snaps.length - 1];
      setScores(prevScores);
      scoresRef.current = prevScores;
      return snaps.slice(0, -1);
    });
  }, []);

  const canGoBack = history.length > 0 && screen !== SCREENS.LANDING && screen !== SCREENS.LOADING && screen !== SCREENS.REVEAL;

  // Debug: ?preview=reveal skips straight to results with mock data
  useEffect(() => {
    const params = new URLSearchParams(window.location?.search || "");
    if (params.get("preview") === "reveal") {
      setSelfSelectedLevel(3);
      setPersona("ic");
      setRole("Product Manager");
      setCompany("Acme Corp");
      setPath("B");
      setScores({
        a1: 3, a2: 2, a3: 3, a4: 2, a5: 3, b1: 2,
        item3Correct: true, item3bCorrect: false,
        item4Choice: "C", item6Level: 3,
        item2Correct: 3, restraintScore: 2,
        apologyAnswer: "no", allergyAnswer: "no", promptLevel: 3,
        behavFreqScore: 3, dietScore: 4, featureDepthScore: 3,
        workflowScore: 0, systemBuilderScore: 0,
      });
      scoresRef.current = {
        a1: 3, a2: 2, a3: 3, a4: 2, a5: 3, b1: 2,
        item3Correct: true, item3bCorrect: false,
        item4Choice: "C", item6Level: 3,
        item2Correct: 3, restraintScore: 2,
        apologyAnswer: "no", allergyAnswer: "no", promptLevel: 3,
        behavFreqScore: 3, dietScore: 4, featureDepthScore: 3,
        workflowScore: 0, systemBuilderScore: 0,
      };
      setScreen(SCREENS.REVEAL);
    }
  }, []);

  const update = (patch) => {
    setScores((prev) => {
      const next = { ...prev, ...patch };
      scoresRef.current = next;
      return next;
    });
  };

  // ── Common trunk handlers ──
  const handleSelfSelect = (level) => {
    setSelfSelectedLevel(level);
    navigate(SCREENS.CONTEXT);
  };

  const handleContext = ({ persona: p, field1, field2 }) => {
    setPersona(p);
    setRole(field1);
    setCompany(field2);
    navigate(SCREENS.BEHAVIORAL_FREQ);
  };

  const handleBehavFreq = (choices) => {
    setBehavFreqChoices(choices);
    const bfScore = scoreBehavioralFreq(choices);
    update({ behavFreqScore: bfScore });
    navigate(SCREENS.AI_DIET);
  };

  const handleAIDiet = (dl, tools, features, useCases, fdScore) => {
    setDietLevel(dl);
    setSelectedTools(tools || []);
    setSelectedFeatures(features || []);
    setSelectedUseCases(useCases || []);
    const ds = scoreAIDiet(dl, (tools || []).length, fdScore || 0, (useCases || []).length);
    update({ dietScore: ds, featureDepthScore: fdScore || 0 });
    // Determine path
    const p = determinePath(selfSelectedLevel, ds, fdScore || 0);
    setPath(p);
    navigate(SCREENS.ITEM1);
  };

  // ── Item handlers ──
  const handleItem1 = (choice) => {
    const correct = choice === "A";
    update({ a3: scores.a3 + (correct ? 1 : 0) });
    navigate(SCREENS.ITEM1_REVEAL);
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
    navigate(SCREENS.ITEM2_REVEAL);
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
    navigate(SCREENS.ITEM3_REVEAL);
  };

  const handleItem3b = (choice) => {
    const correct = choice === "B";
    update({ item3bCorrect: correct });
    navigate(SCREENS.ITEM3B_REVEAL);
  };

  const handleItem4 = (choice) => {
    const scoreMap = { A: 1, B: 2, C: 4, D: 4 };
    update({ a4: scoreMap[choice], item4Choice: choice });
    navigate(SCREENS.ITEM4_REVEAL);
  };

  const handleItem5a = (apology, allergy) => {
    const restraint = (!apology ? 1 : 0) + (!allergy ? 1 : 0);
    update({ a1: scores.a1 + restraint, restraintScore: restraint, apologyAnswer: apology, allergyAnswer: allergy });
    navigate(SCREENS.ITEM5A_REVEAL);
  };

  const handleItem5b = (text) => {
    const level = scorePromptFix(text);
    update({ a2: level, promptLevel: level });
    navigate(SCREENS.ITEM5B_REVEAL);
  };

  const handleItem6 = (text) => {
    const level = scoreFollowUp(text);
    const scoreMap = { 1: 1, 2: 2, 3: 4, 4: 5 };
    update({ a5: scoreMap[level] || 2, item6Level: level });
    // Path C: go to SystemBuilder after Item6
    if (path === PATHS.C) {
      navigate(SCREENS.SYSTEM_BUILDER);
    } else {
      navigate(SCREENS.PARTNER_MODULE);
    }
  };

  const handleWorkflowDesign = (choice, score) => {
    update({ workflowScore: score, workflowChoice: choice });
    navigate(SCREENS.WORKFLOW_DESIGN_REVEAL);
  };

  const handleSystemBuilder = (checked, score) => {
    update({ systemBuilderScore: score });
    navigate(SCREENS.SYSTEM_BUILDER_REVEAL);
  };

  const handlePartnerModule = (answers) => {
    setPartnerAnswers(answers);
    navigate(SCREENS.LOADING);
  };

  const level = computeLevel(scoresRef.current);
  const relationshipStatus = computeRelationshipStatus(scoresRef.current, level);
  const insights = generateInsights(scoresRef.current, level, selfSelectedLevel);

  // ── Path-dependent transitions ──
  // After Item3 Reveal: Path A skips Item3b
  const afterItem3Reveal = path === PATHS.A ? SCREENS.ITEM4 : SCREENS.ITEM3B;
  // After Item4 Reveal: all paths go to Item5a
  // After Item5a Reveal: Path A skips Item5b → goes straight to Item6
  const afterItem5aReveal = path === PATHS.A ? SCREENS.ITEM6 : SCREENS.ITEM5B;
  // After Item5b Reveal: Path C goes to WorkflowDesign, others to Item6
  const afterItem5bReveal = path === PATHS.C ? SCREENS.WORKFLOW_DESIGN : SCREENS.ITEM6;
  // Item6 isLastItem depends on path
  const item6IsLast = path !== PATHS.C;

  const screenMap = {
    [SCREENS.LANDING]: <Landing onStart={() => navigate(SCREENS.SELF_SELECT)} />,
    [SCREENS.SELF_SELECT]: <SelfSelect onSelect={handleSelfSelect} />,
    [SCREENS.CONTEXT]: <ContextCollection onSubmit={handleContext} />,
    [SCREENS.BEHAVIORAL_FREQ]: <BehavioralFrequency onSubmit={handleBehavFreq} />,
    [SCREENS.AI_DIET]: <AIDiet onSubmit={handleAIDiet} />,
    [SCREENS.ITEM1]: <Item1 onAnswer={handleItem1} />,
    [SCREENS.ITEM1_REVEAL]: <Item1Reveal correct={scores.a3 > 0} onContinue={() => navigate(SCREENS.ITEM2)} />,
    [SCREENS.ITEM2]: <Item2 onAnswer={handleItem2} />,
    [SCREENS.ITEM2_REVEAL]: <Item2Reveal scores={scores} onContinue={() => navigate(SCREENS.ITEM3)} />,
    [SCREENS.ITEM3]: <Item3 onAnswer={handleItem3} />,
    [SCREENS.ITEM3_REVEAL]: <Item3Reveal correct={scores.item3Correct} onContinue={() => navigate(afterItem3Reveal)} />,
    [SCREENS.ITEM3B]: <Item3b onAnswer={handleItem3b} />,
    [SCREENS.ITEM3B_REVEAL]: <Item3bReveal correct={scores.item3bCorrect} onContinue={() => navigate(SCREENS.ITEM4)} />,
    [SCREENS.ITEM4]: <Item4 onAnswer={handleItem4} />,
    [SCREENS.ITEM4_REVEAL]: <Item4Reveal choice={scores.item4Choice} onContinue={() => navigate(SCREENS.ITEM5A)} />,
    [SCREENS.ITEM5A]: <Item5a onAnswer={handleItem5a} />,
    [SCREENS.ITEM5A_REVEAL]: <Item5aReveal apology={scores.apologyAnswer} allergy={scores.allergyAnswer} onContinue={() => navigate(afterItem5aReveal)} />,
    [SCREENS.ITEM5B]: <Item5b onAnswer={handleItem5b} />,
    [SCREENS.ITEM5B_REVEAL]: <Item5bReveal level={scores.promptLevel} onContinue={() => navigate(afterItem5bReveal)} />,
    [SCREENS.WORKFLOW_DESIGN]: <WorkflowDesign onAnswer={handleWorkflowDesign} />,
    [SCREENS.WORKFLOW_DESIGN_REVEAL]: <WorkflowDesignReveal choice={scores.workflowChoice || "A"} onContinue={() => navigate(SCREENS.ITEM6)} />,
    [SCREENS.ITEM6]: <Item6 onAnswer={handleItem6} isLastItem={item6IsLast} text={item6Text} onTextChange={setItem6Text} progressStep={path === PATHS.C ? 10 : 10} progressTotal={path === PATHS.C ? 12 : 10} />,
    [SCREENS.SYSTEM_BUILDER]: <SystemBuilder onAnswer={handleSystemBuilder} />,
    [SCREENS.SYSTEM_BUILDER_REVEAL]: <SystemBuilderReveal score={scores.systemBuilderScore} onContinue={() => navigate(SCREENS.PARTNER_MODULE)} />,
    [SCREENS.PARTNER_MODULE]: <PartnerModule onSubmit={handlePartnerModule} />,
    [SCREENS.LOADING]: <LoadingScreen onDone={() => navigate(SCREENS.CAPTURE)} />,
    [SCREENS.CAPTURE]: <LeadCapture level={level} onSubmit={(leadData) => { window.__aiLevelLead = leadData; navigate(SCREENS.REVEAL); }} />,
    [SCREENS.REVEAL]: <LevelReveal level={level} scores={scores} insights={insights} relationshipStatus={relationshipStatus} selfSelectedLevel={selfSelectedLevel} persona={persona} role={role} company={company} path={path} />,
  };

  return (
    <div className="font-sans antialiased relative">
      {canGoBack && <BackButton onClick={goBack} />}
      {screenMap[screen]}
    </div>
  );
}
