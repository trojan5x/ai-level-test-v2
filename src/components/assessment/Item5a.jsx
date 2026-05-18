/**
 * Item5a Component - Restraint and judgment question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Item5a({ assessmentContext }) {
  // Load previous answers if they exist
  const previousAnswers = assessmentContext.state?.assessment?.responses?.item5a || {};
  const [a1, setA1] = useState(previousAnswers.apology || null);
  const [a2, setA2] = useState(previousAnswers.allergy || null);

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 8, total: 8 };    // After Item4, this wouldn't show
      case "B": return { current: 10, total: 10 };  // Last question for Path B
      case "C": return { current: 10, total: 12 };  // Still 2 advanced questions left
      default: return { current: 10, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

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

  const handleAnswer = () => {
    console.log('handleAnswer called', { a1, a2 });
    assessmentContext.handlers.handleItem5a(a1, a2);
  };

  const handlePrevious = () => {
    assessmentContext.updateUrl('item4');
  };

  const handleNext = () => {
    console.log('handleNext called', { a1, a2, previousAnswers, allDone });
    const answer1 = a1 !== null ? a1 : previousAnswers.apology;
    const answer2 = a2 !== null ? a2 : previousAnswers.allergy;
    console.log('Final answers:', { answer1, answer2 });
    if (answer1 !== null && answer2 !== null) {
      console.log('Calling handleItem5a');
      assessmentContext.handlers.handleItem5a(answer1, answer2);
    } else {
      console.log('Cannot proceed - missing answers');
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${answers[s.key] === true
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-gray-800/60 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                        }`}
                    >
                      Yes, use AI
                    </button>
                    <button
                      onClick={() => setters[s.key](false)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${answers[s.key] === false
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
          
          {/* Navigation buttons */}
          <FadeIn delay={200} className="w-full">
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
                disabled={!allDone && Object.keys(previousAnswers).length < 2}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  allDone || Object.keys(previousAnswers).length >= 2
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

export default Item5a;