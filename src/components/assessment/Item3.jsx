/**
 * Item3 Component - Artifact Effect question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState, useRef, useEffect } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Item3({ assessmentContext }) {
  // Load previous answers if they exist
  const previousAnswer = assessmentContext.state?.assessment?.responses?.item3;
  const [selected, setSelected] = useState(previousAnswer?.choice || null);

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 7, total: 8 };    // No Item3b
      case "B": return { current: 7, total: 10 };   // Includes Item3b
      case "C": return { current: 7, total: 12 };   // Includes Item3b + advanced questions
      default: return { current: 7, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();
  const [confidence, setConfidence] = useState(previousAnswer?.confidence || null);
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

  const handleAnswer = () => {
    assessmentContext.handlers.handleItem3(selected, confidence);
  };

  const handlePrevious = () => {
    assessmentContext.updateUrl('item2');
  };

  const handleNext = () => {
    const choiceToSubmit = selected || previousAnswer?.choice;
    const confidenceToSubmit = confidence || previousAnswer?.confidence;
    if (choiceToSubmit && confidenceToSubmit) {
      assessmentContext.handlers.handleItem3(choiceToSubmit, confidenceToSubmit);
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-8">
          <ProgressBar current={progressInfo.current} total={progressInfo.total} showStepNumbers={true} />
          <div className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto pt-4">
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
                  selected === "A" 
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20" 
                    : "border-gray-800/60 bg-gray-900/50 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-blue-400/60 text-xs font-semibold tracking-widest">A</div>
                  {selected === "A" && (
                    <div className="text-blue-400 text-sm ml-auto">✓ Selected</div>
                  )}
                  {selected !== "A" && (
                    <div className="flex gap-0.5 ml-auto">
                      <div className="w-1 h-3 bg-gray-700 rounded-full" />
                      <div className="w-1 h-3 bg-gray-700 rounded-full" />
                      <div className="w-1 h-3 bg-gray-700 rounded-full" />
                    </div>
                  )}
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
                  selected === "B" 
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20" 
                    : "border-gray-800/60 bg-gray-900/50 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-blue-400/60 text-xs font-semibold tracking-widest">B</div>
                  {selected === "B" && (
                    <div className="text-blue-400 text-sm ml-auto">✓ Selected</div>
                  )}
                </div>
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
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${confidence === c
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-gray-800/60 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* Navigation buttons */}
          <FadeIn delay={500} className="w-full">
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
                ref={continueButtonRef}
                onClick={handleNext}
                disabled={(!selected && !previousAnswer?.choice) || (!confidence && !previousAnswer?.confidence)}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  (selected || previousAnswer?.choice) && (confidence || previousAnswer?.confidence)
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
      </div>
    </ScreenTransition>
  );
}

export default Item3;