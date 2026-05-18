/**
 * AIDiet Component - AI Tool Usage Assessment (Based on Modified Flow)
 * 3-step process: Diet Level → Tools & Features → Use Cases
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

// Complete tool features mapping from modified flow (exact match)
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
  "Copilot": [
    { id: "code_complete", label: "Code Completion", advanced: false },
    { id: "copilot_agent_mode", label: "Agent Mode", advanced: true },
    { id: "copilot_workspace", label: "Copilot Workspace", advanced: true },
    { id: "copilot_mcp", label: "MCP Extensions", advanced: true },
  ],
  "Cursor / Windsurf": [
    // Cursor features
    { id: "cursor_composer", label: "Composer", advanced: true },
    { id: "cursor_agent", label: "Agent Mode", advanced: true },
    { id: "cursor_background", label: "Background Agents", advanced: true },
    { id: "cursor_chat", label: "Chat", advanced: false },
    // Windsurf features
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
  "Midjourney / DALL-E": [
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

function AIDiet({ assessmentContext }) {
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
      const dietData = {
        selectedTools: [],
        featureResponses: {},
        dietScore: 0,
        featureDepthScore: 0
      };
      assessmentContext.handlers.handleAIDiet(dietData);
    } else {
      setTimeout(() => setStep(1), 200);
    }
  };

  const handleToolsContinue = () => {
    setStep(2);
  };

  const scoreFeatureDepth = (features) => {
    const advancedCount = features.filter(fId => {
      return Object.values(TOOL_FEATURES).some(toolFeatures => 
        toolFeatures.some(f => f.id === fId && f.advanced)
      );
    }).length;
    return Math.min(4, Math.floor(advancedCount / 2)); // 0-4 scale
  };

  const handleFinalSubmit = () => {
    const fdScore = scoreFeatureDepth(selectedFeatures);
    const toolCount = selectedTools.length;
    const dietScore = Math.min(4, Math.floor(toolCount / 2)); // 0-4 scale
    
    const dietData = {
      selectedTools,
      featureResponses: { selectedFeatures, selectedUseCases },
      dietScore,
      featureDepthScore: fdScore
    };
    
    assessmentContext.handlers.handleAIDiet(dietData);
  };

  const handlePrevious = () => {
    assessmentContext.navigation.goBack();
  };

  // Step 0: Usage level
  if (step === 0) {
    return (
      <ScreenTransition>
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-start pt-8 pb-4 px-6">
            <ProgressBar current={4} total={10} showStepNumbers={true} />
            
            <FadeIn delay={200} direction="fade">
              <div className="max-w-lg text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">What's your AI diet?</h2>
                <p className="text-gray-500 text-sm">Pick the one closest to how you actually use AI today.</p>
              </div>
            </FadeIn>
            
            <div className="max-w-md w-full space-y-2">
              {options.map((opt, i) => (
                <FadeIn key={opt.id} delay={300 + (i * 80)} direction="up">
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
        </div>
      </ScreenTransition>
    );
  }

  // Step 1: Tools + feature depth
  if (step === 1) {
    return (
      <ScreenTransition>
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-start pt-8 pb-4 px-6 overflow-auto">
            <ProgressBar current={4} total={10} showStepNumbers={true} />
            
            <FadeIn delay={200} direction="fade">
              <div className="max-w-lg text-center mb-5">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Which tools do you use?</h2>
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
              <FadeIn delay={300} direction="up">
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

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full max-w-lg mx-auto">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2 invisible"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
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
        </div>
      </ScreenTransition>
    );
  }

  // Step 2: Use cases
  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-start pt-8 pb-4 px-6">
          <ProgressBar current={4} total={8} showStepNumbers={true} />
          
          <FadeIn delay={200} direction="fade">
            <div className="max-w-lg text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">What do you use AI for?</h2>
              <p className="text-gray-500 text-sm">Tap all that apply. This helps us understand your AI breadth.</p>
            </div>
          </FadeIn>
          
          <div className="max-w-md w-full">
            <div className="grid grid-cols-2 gap-2">
              {USE_CASES.map((uc, i) => (
                <FadeIn key={uc.id} delay={300 + (i * 50)} direction="up">
                  <button
                    onClick={() => toggleUseCase(uc.id)}
                    className={`text-left px-3.5 py-3 rounded-xl border transition-all duration-200 ${
                      selectedUseCases.includes(uc.id)
                        ? "border-blue-500/50 bg-blue-500/5"
                        : "border-gray-800/40 bg-gray-900/30 hover:border-gray-700"
                    }`}
                  >
                    <span className="text-sm mr-1.5">{uc.emoji}</span>
                    <span className={`text-sm ${selectedUseCases.includes(uc.id) ? "text-white font-medium" : "text-gray-300"}`}>
                      {uc.label}
                    </span>
                  </button>
                </FadeIn>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full max-w-lg mx-auto">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2 invisible"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <button
                onClick={handleFinalSubmit}
                className="bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default AIDiet;