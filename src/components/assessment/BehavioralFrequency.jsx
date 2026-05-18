/**
 * BehavioralFrequency Component - Behavioral Assessment (Based on Modified Flow)
 * 4 A/B choice pairs presented one at a time with auto-advance
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function BehavioralFrequency({ assessmentContext }) {
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
        // All done — submit with behavioral scoring
        const behavFreqScore = calculateBehavioralScore(updated);
        assessmentContext.handlers.handleBehavioralFrequency(updated, behavFreqScore);
      }
    }, 400);
  };

  const calculateBehavioralScore = (responses) => {
    let score = 0;
    // Score based on mature AI usage patterns
    if (responses.iterate === "b") score++; // Push back shows critical thinking
    if (responses.tools === "b") score++; // Tool switching shows sophistication  
    if (responses.start === "b") score++; // AI-first thinking
    if (responses.evaluate === "b") score++; // Substance over polish
    return score; // 0-4 scale
  };

  const pair = pairs[current];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          <ProgressBar current={3} total={10} showStepNumbers={true} />
          
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

          <FadeIn delay={200} direction="fade">
            <div className="max-w-sm text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Which is more like you?</h2>
              <p className="text-gray-600 text-xs">Tap one</p>
            </div>
          </FadeIn>

          {/* Single pair — two big tappable cards */}
          <div 
            key={pair.id} 
            className={`max-w-sm w-full space-y-3 transition-all duration-300 ${
              animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            <button
              onClick={() => handleSelect("a")}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                choices[pair.id] === "a"
                  ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                  : "border-gray-800/60 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/60 active:scale-[0.98]"
              }`}
            >
              <p className={`text-sm leading-relaxed ${
                choices[pair.id] === "a" ? "text-white font-medium" : "text-gray-300"
              }`}>
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
              <p className={`text-sm leading-relaxed ${
                choices[pair.id] === "b" ? "text-white font-medium" : "text-gray-300"
              }`}>
                {pair.b}
              </p>
            </button>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default BehavioralFrequency;