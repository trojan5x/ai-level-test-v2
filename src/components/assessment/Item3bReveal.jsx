/**
 * Item3bReveal Component - Reveal screen for Agreement Trap question
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';
import { mergeAssessmentScores } from '../../utils/stateManager.js';

function Item3bReveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const scores = mergeAssessmentScores(state.assessment);
  const correct = scores.item3bCorrect === true;

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item4');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={correct} label={correct ? "You caught the yes-man" : "The Agreement Trap"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">
              {correct
                ? "The yes-man response validated the premise without questioning it. The challenging response pushed back on the assumption — 'having it first doesn't mean you own it.' That's the AI you want."
                : "The yes-man response told you what you wanted to hear. It agreed with your framing ('should we be worried?' → 'you're right to not worry') without actually analyzing anything."}
            </p>
            <div className={`rounded-xl p-4 border mb-8 text-left ${
              correct ? "bg-emerald-500/5 border-emerald-500/15" : "bg-amber-500/5 border-amber-500/15"
            }`}>
              <p className={`text-xs font-medium mb-1 ${correct ? "text-emerald-400/80" : "text-amber-400/80"}`}>
                {correct ? "Why this matters" : "The Agreement Trap"}
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {correct
                  ? "AI defaults to agreeing with your premise. Spotting when it's being a yes-man — vs when it's genuinely analyzing — is how you avoid expensive blind spots."
                  : "AI is trained to be helpful, which often means agreeable. When you phrase a question with a built-in assumption ('should we be worried?'), weaker AI confirms your bias instead of challenging it."}
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

export default Item3bReveal;
