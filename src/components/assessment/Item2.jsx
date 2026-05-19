/**
 * Item2 Component - AI capabilities calibration question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState, useRef, useEffect } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Item2({ assessmentContext }) {
  // Load previously selected answers if they exist
  const previousRatings = assessmentContext.state?.assessment?.responses?.item2 || {};
  const [ratings, setRatings] = useState(previousRatings);
  const continueButtonRef = useRef(null);

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 6, total: 8 };    // No Item3b
      case "B": return { current: 6, total: 10 };   // Includes Item3b
      case "C": return { current: 6, total: 12 };   // Includes Item3b + advanced questions
      default: return { current: 6, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

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

  const handleAnswer = () => {
    assessmentContext.handlers.handleItem2(ratings);
  };

  const handlePrevious = () => {
    assessmentContext.updateUrl('item1');
  };

  const handleNext = () => {
    // Continue with current selection or previously selected ratings
    const ratingsToSubmit = Object.keys(ratings).length > 0 ? ratings : previousRatings;
    if (Object.keys(ratingsToSubmit).length === 4) {
      assessmentContext.handlers.handleItem2(ratingsToSubmit);
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
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${ratings[task.id] === opt
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
          
          {/* Navigation buttons */}
          <FadeIn delay={200} className="w-full">
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full">
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2 invisible"
              >
                <svg className="invisible w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <button
                ref={continueButtonRef}
                onClick={handleNext}
                disabled={!allAnswered && Object.keys(previousRatings).length !== 4}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  allAnswered || Object.keys(previousRatings).length === 4
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

export default Item2;