/**
 * Item5aReveal Component - Reveal screen for restraint and judgment question
 * Extracted from App.jsx for new navigation system
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function Item5aReveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const apology =
    state.assessment.scores?.apologyAnswer ??
    state.assessment.apologyAnswer;
  const allergy =
    state.assessment.scores?.allergyAnswer ??
    state.assessment.allergyAnswer;
  
  const apologyCorrect = apology === false;
  const allergyCorrect = allergy === false;
  const both = apologyCorrect && allergyCorrect;

  let msg, subMsg;
  if (both) {
    msg = "You knew when to step away from AI. That's one of the most underrated skills — and one most assessments never test.";
    subMsg = "Apologies need your voice. Allergy recipes need verified safety. You got both.";
  } else if (!apologyCorrect && !allergyCorrect) {
    msg = "AI is tempting for everything. But apologies need your real voice, and allergies need verified safety.";
    subMsg = "AI's confident mistakes are annoying in a document. They're dangerous in a recipe.";
  } else if (!apologyCorrect) {
    msg = "The allergy call was smart. But apologies aren't information problems — they're trust problems.";
    subMsg = "AI can't rebuild trust because it wasn't there to break it.";
  } else {
    msg = "Good instinct on the apology. But when the wrong answer has physical consequences, confident AI guessing becomes dangerous.";
    subMsg = "AI doesn't know what it doesn't know about your partner's safety.";
  }

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item5b');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={both} label={both ? "Restraint is a skill" : "Worth thinking about"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-2">{msg}</p>
            <p className="text-gray-600 text-sm italic">{subMsg}</p>
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

export default Item5aReveal;