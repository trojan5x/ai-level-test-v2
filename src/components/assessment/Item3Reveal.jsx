/**
 * Item3Reveal Component - Reveal screen for Artifact Effect question
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';
import { mergeAssessmentScores } from '../../utils/stateManager.js';

function Item3Reveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const scores = mergeAssessmentScores(state.assessment);
  const correct = scores.item3Correct === true;

  const handleContinue = () => {
    const path = state.navigation?.assessmentPath || 'B';
    const nextScreen = path === 'A' ? 'item4' : 'item3b';
    assessmentContext.handlers.handleRevealContinue(nextScreen);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "You see through polish" : "The Artifact Effect got you"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">
              {correct
                ? "The polished response has structure. Bold headers. Professional tone. But it says nothing specific. The useful response has a real diagnosis. You caught that."
                : "The polished response looks like expertise — bold headers, structured pillars, clear recommendations. But strip the formatting and it says nothing specific. The useful response actually diagnoses the problem."}
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
