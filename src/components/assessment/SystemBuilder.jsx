/**
 * SystemBuilder Component - What have you built? (Path C)
 * Checkbox-based question testing real AI system-building experience
 * Final question for expert path users
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function SystemBuilder({ assessmentContext }) {
  const [checked, setChecked] = useState({});

  const path = assessmentContext.state?.navigation?.assessmentPath || "C";
  const getProgressInfo = () => {
    switch(path) {
      case "C": return { current: 12, total: 12 };
      default: return { current: 12, total: 12 };
    }
  };
  const progressInfo = getProgressInfo();

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

  const handleSubmit = () => {
    const score = computeScore();
    assessmentContext.handlers.handleSystemBuilder(checked, score);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-4">
          <ProgressBar
            current={progressInfo.current}
            total={progressInfo.total}
            path={path}
            showStepNumbers={true}
          />

          <div className="flex-1 flex flex-col pt-4 max-w-lg mx-auto w-full">
            <FadeIn delay={200} direction="fade">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-3">
                  <span className="text-purple-400 text-[10px] font-semibold tracking-wider">ADVANCED</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">What have you built?</h2>
                <p className="text-gray-500 text-sm">Check everything you've actually done. Be honest — this is where it counts.</p>
              </div>
            </FadeIn>

            <div className="space-y-2 mb-6">
              {items.map((item, i) => (
                <FadeIn key={item.id} delay={300 + i * 80} direction="up">
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

            <FadeIn delay={800} direction="fade">
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  className="bg-white text-gray-950 font-semibold px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-white/10"
                >
                  {checkedCount === 0 ? "None of these — Continue →" : "Continue →"}
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default SystemBuilder;