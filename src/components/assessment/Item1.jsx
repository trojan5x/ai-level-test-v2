/**
 * Item1 Component - First assessment question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState, useEffect } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Item1({ assessmentContext }) {
  // Load previously selected answer if exists
  const previousAnswer = assessmentContext.state?.assessment?.responses?.item1;
  const [selectedAnswer, setSelectedAnswer] = useState(previousAnswer || null);

  const handleAnswer = (choice) => {
    setSelectedAnswer(choice);
    // Auto-advance after selection
    setTimeout(() => {
      assessmentContext.handlers.handleItem1(choice);
    }, 600);
  };

  const handlePrevious = () => {
    assessmentContext.updateUrl('aiDiet');
  };

  const handleNext = () => {
    // Continue with current selection or previously selected answer
    const answerToSubmit = selectedAnswer || previousAnswer;
    if (answerToSubmit) {
      assessmentContext.handlers.handleItem1(answerToSubmit);
    }
  };

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 5, total: 8 };    // No Item3b
      case "B": return { current: 5, total: 10 };   // Includes Item3b
      case "C": return { current: 5, total: 12 };   // Includes Item3b + advanced questions
      default: return { current: 5, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-4">
          <ProgressBar current={progressInfo.current} total={progressInfo.total} showStepNumbers={true} />

          <div className="flex-1 flex flex-col pt-4 max-w-2xl mx-auto w-full">
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
                  onClick={() => handleAnswer("A")}
                  className={`group text-left p-4 sm:p-5 rounded-2xl border transition-all duration-500 w-full hover:scale-[1.01] hover:shadow-lg ${
                    selectedAnswer === "A" 
                      ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20' 
                      : 'border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 hover:shadow-blue-500/10'
                  }`}
                >
                  <div className="text-blue-400/60 text-xs font-semibold mb-2 tracking-widest transition-colors group-hover:text-blue-400/80">A</div>
                  <p className="text-gray-300 leading-relaxed text-sm group-hover:text-white transition-colors duration-300">
                    Working from home kills focus. Set up in one spot, close every tab except what you need, and use a timer. Real work happens in blocks of uninterrupted time. Don't pretend you're being productive while scrolling. You're not.
                  </p>
                  {selectedAnswer === "A" && (
                    <div className="text-blue-400 text-sm mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Selected
                    </div>
                  )}
                </button>
              </FadeIn>

              <FadeIn delay={550} direction="right">
                <button
                  onClick={() => handleAnswer("B")}
                  className={`group text-left p-4 sm:p-5 rounded-2xl border transition-all duration-500 w-full hover:scale-[1.01] hover:shadow-lg ${
                    selectedAnswer === "B" 
                      ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20' 
                      : 'border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 hover:shadow-blue-500/10'
                  }`}
                >
                  <div className="text-blue-400/60 text-xs font-semibold mb-2 tracking-widest transition-colors group-hover:text-blue-400/80">B</div>
                  <p className="text-gray-300 leading-relaxed text-sm group-hover:text-white transition-colors duration-300">
                    To maximize productivity while working from home, establish a dedicated workspace and implement time-blocking techniques. Minimize digital distractions by organizing your digital environment and utilizing focus tools. Consistent routines enhance concentration and output quality.
                  </p>
                  {selectedAnswer === "B" && (
                    <div className="text-blue-400 text-sm mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Selected
                    </div>
                  )}
                </button>
              </FadeIn>
            </div>

            {/* Navigation buttons */}
            <FadeIn delay={700} className="w-full">
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2 invisible"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={!selectedAnswer && !previousAnswer}
                  className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                    selectedAnswer || previousAnswer
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

export default Item1;