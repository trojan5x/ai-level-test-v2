/**
 * Item2Reveal Component - Reveal screen for AI calibration question
 * Extracted from App.jsx for new navigation system
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function Item2Reveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const correct =
    state.assessment.scores?.item2Correct ??
    state.assessment.item2Correct ??
    0;
  const messages = {
    high: "You understand AI's boundary better than most. You know what to hand it and what to keep.",
    mid: "Solid intuition about AI's edges. A few blind spots, but you know the shape.",
    low: "You're optimistic about AI — but the confidence trap is real. AI is best at structure, not judgment.",
  };
  const msg = correct >= 3 ? messages.high : correct >= 2 ? messages.mid : messages.low;

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item3');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <div className="flex justify-center gap-1.5 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${i < correct
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-800/40 text-gray-700 border border-gray-800/60"
                    }`}
                >
                  {i < correct ? "✓" : "·"}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs mb-4 tracking-wide">{correct}/4 calibrated correctly</p>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">{msg}</p>
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

export default Item2Reveal;