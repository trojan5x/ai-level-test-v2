/**
 * Item3b Component - Agreement Trap Test
 * Options shuffled per session; correctness keyed by semantic ID.
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';
import useQuestionOptions from '../../hooks/useQuestionOptions.js';
import { ITEM3B_OPTIONS } from '../../utils/questionOptions.js';

function Item3b({ assessmentContext }) {
  const previousChoice = assessmentContext.state?.assessment?.responses?.item3b;
  const {
    orderedOptions,
    selectedId,
    setSelectedId,
    displayLabel,
  } = useQuestionOptions({
    assessmentContext,
    questionKey: 'item3b',
    optionDefs: ITEM3B_OPTIONS,
    previousChoice: previousChoice || null,
  });

  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 8, total: 8 };
      case "B": return { current: 8, total: 10 };
      case "C": return { current: 8, total: 12 };
      default: return { current: 8, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

  const handleNext = () => {
    if (selectedId) {
      assessmentContext.handlers.handleItem3b(selectedId);
    }
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

          <div className="flex-1 flex flex-col pt-4 max-w-2xl mx-auto w-full">
            <FadeIn delay={200} direction="fade">
              <div className="text-center mb-6">
                <p className="text-blue-400/50 text-xs font-medium mb-2">Critical thinking check</p>
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Which response shows better judgment?</h2>
                <p className="text-gray-500 text-sm">You asked AI: "Our competitor just launched a feature we've had for 6 months. Should we be worried?"</p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {orderedOptions.map((option, index) => (
                <FadeIn key={option.id} delay={300 + index * 150} direction="up">
                  <button
                    onClick={() => setSelectedId(option.id)}
                    className={`group text-left p-5 rounded-2xl border transition-all duration-300 w-full hover:scale-[1.01] hover:shadow-lg ${
                      selectedId === option.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
                        : 'border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 hover:shadow-blue-500/10'
                    }`}
                  >
                    <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest transition-colors group-hover:text-blue-400/80">
                      {displayLabel(index)}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                      {option.text}
                    </p>
                    {selectedId === option.id && (
                      <div className="mt-3 text-blue-400 text-sm flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        Selected
                      </div>
                    )}
                  </button>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={1200} direction="fade">
              <div className="text-center mt-8">
                <p className="text-xs text-gray-600">
                  Think about what makes a helpful AI response vs. an unhelpful one
                </p>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={100} className="w-full">
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full max-w-2xl mx-auto">
              <button
                onClick={() => assessmentContext.updateUrl('item3')}
                className="invisible flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedId}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  selectedId
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

export default Item3b;
