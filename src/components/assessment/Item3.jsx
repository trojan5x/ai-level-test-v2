/**
 * Item3 Component - Artifact Effect question
 * Options shuffled per session; correctness keyed by semantic ID.
 */

import React, { useState, useRef, useEffect } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';
import useQuestionOptions from '../../hooks/useQuestionOptions.js';
import { ITEM3_OPTIONS } from '../../utils/questionOptions.js';

function renderItem3OptionText(option) {
  if (option.id === 'polished_trap') {
    return (
      <>
        To boost team productivity, focus on three core pillars.{' '}
        <strong className="text-gray-200">First, optimize your workflow processes</strong>
        {' '}— streamline communication and reduce meeting overhead.{' '}
        <strong className="text-gray-200">Second, invest in the right tools</strong>
        {' '}— the tech stack matters more than most realize.{' '}
        <strong className="text-gray-200">Third, foster accountability.</strong>
        {' '}These levers create a multiplicative effect. Start by conducting a productivity audit.
      </>
    );
  }
  return option.text;
}

function Item3({ assessmentContext }) {
  const previousAnswer = assessmentContext.state?.assessment?.responses?.item3;
  const {
    orderedOptions,
    selectedId,
    setSelectedId,
    displayLabel,
  } = useQuestionOptions({
    assessmentContext,
    questionKey: 'item3',
    optionDefs: ITEM3_OPTIONS,
    previousChoice: previousAnswer?.choice || null,
  });

  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 7, total: 8 };
      case "B": return { current: 7, total: 10 };
      case "C": return { current: 7, total: 12 };
      default: return { current: 7, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();
  const [confidence, setConfidence] = useState(previousAnswer?.confidence || null);
  const confidenceRef = useRef(null);
  const continueButtonRef = useRef(null);

  useEffect(() => {
    if (selectedId && confidenceRef.current) {
      setTimeout(() => {
        confidenceRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 200);
    }
  }, [selectedId]);

  useEffect(() => {
    if (confidence && continueButtonRef.current) {
      setTimeout(() => {
        continueButtonRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [confidence]);

  const handlePrevious = () => {
    assessmentContext.updateUrl('item2');
  };

  const handleNext = () => {
    const choiceToSubmit = selectedId || previousAnswer?.choice;
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
            {orderedOptions.map((option, index) => (
              <FadeIn key={option.id} delay={200 + index * 150}>
                <button
                  onClick={() => setSelectedId(option.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 w-full ${
                    selectedId === option.id
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : "border-gray-800/60 bg-gray-900/50 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-blue-400/60 text-xs font-semibold tracking-widest">
                      {displayLabel(index)}
                    </div>
                    {selectedId !== option.id && option.id === 'polished_trap' && (
                      <div className="flex gap-0.5 ml-auto">
                        <div className="w-1 h-3 bg-gray-700 rounded-full" />
                        <div className="w-1 h-3 bg-gray-700 rounded-full" />
                        <div className="w-1 h-3 bg-gray-700 rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {renderItem3OptionText(option)}
                  </p>
                </button>
              </FadeIn>
            ))}
          </div>
          {selectedId && (
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

          <FadeIn delay={500} className="w-full">
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
                disabled={(!selectedId && !previousAnswer?.choice) || (!confidence && !previousAnswer?.confidence)}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  (selectedId || previousAnswer?.choice) && (confidence || previousAnswer?.confidence)
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
