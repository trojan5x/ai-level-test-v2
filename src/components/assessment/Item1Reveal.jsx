/**
 * Item1Reveal Component - Reveal screen for first assessment question
 * Extracted from App.jsx for new navigation system
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function Item1Reveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const choice = state.assessment.responses.item1;
  const correct = choice === "A";

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item2');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "Sharp eye" : "Tricky one"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-2">
              {correct
                ? "You caught it. B plays it safe — every phrase balanced, no opinions taken. AI loves the middle ground."
                : "A sounds rougher, but that's the tell. Humans argue and take sides. AI hedges."}
            </p>
            <p className="text-gray-600 text-sm mb-8">
              {correct
                ? "Most people pick the polished one. You didn't."
                : "This is the most common mistake — and it matters more than you think."}
            </p>
            
            <TimedAdvance 
              onAdvance={handleContinue}
              duration={3500}
              label="Next →"
            />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

export default Item1Reveal;