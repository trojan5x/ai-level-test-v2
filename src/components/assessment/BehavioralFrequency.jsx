/**
 * BehavioralFrequency Component - Behavioral Assessment (Based on Modified Flow)
 * 4 choice pairs presented one at a time; options shuffled per pair.
 */

import React, { useEffect, useMemo, useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';
import {
  BEHAVIORAL_PAIRS,
  getBehavioralOptionOrderKey,
  scoreBehavioralFrequency,
} from '../../utils/questionOptions.js';
import {
  applyOptionOrderToState,
  getOrCreateOptionOrder,
} from '../../utils/optionOrder.js';
import { getSessionId, saveAssessmentState } from '../../utils/stateManager.js';

function BehavioralFrequency({ assessmentContext }) {
  const previousResponses =
    assessmentContext.state?.assessment?.responses?.behavioralFreq || {};
  const [choices, setChoices] = useState(previousResponses);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const sessionId = getSessionId();
  const state = assessmentContext.state;

  const pairOrders = useMemo(() => {
    const orders = {};
    for (const pair of BEHAVIORAL_PAIRS) {
      const key = getBehavioralOptionOrderKey(pair.id);
      const optionIds = pair.options.map((o) => o.id);
      orders[pair.id] = getOrCreateOptionOrder(state, key, optionIds, sessionId);
    }
    return orders;
  }, [state, sessionId]);

  useEffect(() => {
    if (!assessmentContext?.setState) return;
    let updated = state;
    let changed = false;
    for (const pair of BEHAVIORAL_PAIRS) {
      const { order, isNew } = pairOrders[pair.id];
      if (isNew) {
        updated = applyOptionOrderToState(updated, getBehavioralOptionOrderKey(pair.id), order);
        changed = true;
      }
    }
    if (changed) {
      assessmentContext.setState(updated);
      saveAssessmentState(updated);
    }
  }, [pairOrders, state, assessmentContext]);

  const pair = BEHAVIORAL_PAIRS[current];
  const { order } = pairOrders[pair.id] || { order: pair.options.map((o) => o.id) };
  const orderedOptions = order
    .map((id) => pair.options.find((o) => o.id === id))
    .filter(Boolean);

  const handleSelect = (optionId) => {
    if (animating) return;
    setChoices((prev) => ({ ...prev, [pair.id]: optionId }));
  };

  const handleNext = () => {
    if (current < BEHAVIORAL_PAIRS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(current + 1);
        setAnimating(false);
      }, 300);
    } else {
      const behavFreqScore = scoreBehavioralFrequency(choices);
      assessmentContext.handlers.handleBehavioralFrequency(choices, behavFreqScore);
    }
  };

  const handlePrevious = () => {
    if (current > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(current - 1);
        setAnimating(false);
      }, 300);
    } else {
      assessmentContext.updateUrl('context');
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-8">
          <ProgressBar current={3} total={10} showStepNumbers={true} />
          <div className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto pt-4 relative">

          <div className="flex items-center gap-2 mb-8">
            {BEHAVIORAL_PAIRS.map((_, i) => (
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

          <div
            key={pair.id}
            className={`max-w-sm w-full space-y-3 transition-all duration-300 ${
              animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            {orderedOptions.map((option, index) => (
              <React.Fragment key={option.id}>
                {index === 1 && (
                  <div className="flex items-center justify-center">
                    <span className="text-gray-700 text-[10px] font-medium tracking-widest">OR</span>
                  </div>
                )}
                <button
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                    choices[pair.id] === option.id
                      ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                      : "border-gray-800/60 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/60 active:scale-[0.98]"
                  }`}
                >
                  <p className={`text-sm leading-relaxed ${
                    choices[pair.id] === option.id ? "text-white font-medium" : "text-gray-300"
                  }`}>
                    {option.text}
                  </p>
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full">
            <button
              onClick={handlePrevious}
              className="invisible flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!choices[pair.id]}
              className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                choices[pair.id]
                  ? 'bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {current < BEHAVIORAL_PAIRS.length - 1 ? 'Next →' : 'Continue →'}
            </button>
          </div>

          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default BehavioralFrequency;
