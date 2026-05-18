/**
 * Item3Reveal Component - Reveal screen for Artifact Effect question
 * Extracted from App.jsx for new navigation system
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function Item3Reveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const response = state.assessment.responses.item3;
  const correct = response?.choice === "B";

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item4');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "You see through polish" : "The Artifact Effect got you"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">
              {correct
                ? "Response A has structure. Bold headers. Professional tone. But it says nothing specific. Response B has a real diagnosis. You caught that."
                : "Response A looks like expertise — bold headers, structured pillars, clear recommendations. But strip the formatting and it says nothing specific. Response B actually diagnoses the problem."}
            </p>
            <div className={`rounded-xl p-4 border mb-8 text-left ${correct ? "bg-emerald-500/5 border-emerald-500/15" : "bg-amber-500/5 border-amber-500/15"
              }`}>
              <p className={`text-xs font-medium mb-1 ${correct ? "text-emerald-400/80" : "text-amber-400/80"}`}>
                {correct ? "Why this matters" : "This has a name"}
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {correct
                  ? "Most people default to the polished-looking response. Seeing through that is the single biggest skill gap between Level 2 and Level 3."
                  : "The Artifact Effect: when AI output looks professional, your brain shortcuts past 'is this actually saying something?' That shortcut is what keeps most people at Level 2."}
              </p>
            </div>
            <TimedAdvance 
              onAdvance={handleContinue}
              duration={4000}
              label="Next →"
            />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

export default Item3Reveal;