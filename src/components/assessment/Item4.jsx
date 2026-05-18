/**
 * Item4 Component - Strategic thinking and AI collaboration question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Item4({ assessmentContext }) {
  // Load previous answer if exists
  const previousAnswer = assessmentContext.state?.assessment?.responses?.item4;
  const [selected, setSelected] = useState(previousAnswer || null);

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 8, total: 8 };    // Last question for Path A
      case "B": return { current: 9, total: 10 };   // Item3b was step 8
      case "C": return { current: 9, total: 12 };   // Item3b was step 8
      default: return { current: 9, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

  const options = [
    { id: "A", text: "That's solid. Use the structure and start drafting your slides." },
    { id: "B", text: "Ask AI to expand the \"lessons learned\" section, make it more executive-focused, and add bullet points." },
    { id: "C", text: "Tell AI: \"This doesn't explain how we decided what to cut. The VP needs to see we were strategic, not reactive. Restructure around the deprioritization logic.\"" },
    { id: "D", text: "Scrap the timeline approach. Ask AI to map business outcomes your project enabled — you'll build the narrative from there." },
  ];

  const handleAnswer = () => {
    assessmentContext.handlers.handleItem4(selected);
  };

  const handlePrevious = () => {
    const path = assessmentContext.state?.navigation?.assessmentPath;
    const prev = path === 'A' ? 'item3' : 'item3b';
    assessmentContext.updateUrl(prev);
  };

  const handleNext = () => {
    const answerToSubmit = selected || previousAnswer;
    if (answerToSubmit) {
      assessmentContext.handlers.handleItem4(answerToSubmit);
    }
  };

  const handleOptionSelect = (optionId) => {
    setSelected(optionId);
    // Auto-advance after selection
    setTimeout(() => {
      assessmentContext.handlers.handleItem4(optionId);
    }, 600);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <ProgressBar current={progressInfo.current} total={progressInfo.total} showStepNumbers={true} />
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
                  onClick={() => handleOptionSelect(opt.id)}
                  className={`text-left w-full p-4 rounded-2xl border transition-all duration-200 ${
                    selected === opt.id
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : "border-gray-800/60 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-blue-400/50 text-xs font-semibold mr-2">{opt.id}.</span>
                      <span className="text-gray-300 text-sm">{opt.text}</span>
                    </div>
                    {selected === opt.id && (
                      <div className="text-blue-400 text-sm ml-2">✓</div>
                    )}
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
          
          {/* Navigation buttons */}
          <FadeIn delay={100} className="w-full">
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full">
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!selected && !previousAnswer}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  selected || previousAnswer
                    ? 'bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue →
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default Item4;