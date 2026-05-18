/**
 * Item4Reveal Component - Reveal screen for strategic thinking question
 * Extracted from App.jsx for new navigation system
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function Item4Reveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const choice =
    state.assessment.scores?.item4Choice ??
    state.assessment.item4Choice ??
    state.assessment.responses?.item4;
  
  const data = {
    A: { quality: "low", text: "You're getting value from AI, but you're not leveraging the collaboration — the ability to push back and co-author the thinking.", insight: "Accepting the first draft means you're using AI as a search engine, not a thinking partner." },
    B: { quality: "mid", text: "You're treating it as a first draft, which is good. But you're polishing the container, not the content. The structure still doesn't answer what the VP actually wants to know.", insight: "Iterating on format feels productive. Iterating on reasoning IS productive." },
    C: { quality: "high", text: "You spotted the gap between generic best practice and what your specific audience needs. That's the difference between using AI to fill a template and using AI to think.", insight: "The VP doesn't need a timeline. They need proof of strategic judgment. You caught that." },
    D: { quality: "high", text: "You rejected AI's frame for your own. That's strong judgment — as long as it's strategic, not avoidant.", insight: "Reframing the problem is the highest-leverage AI skill. Most people never try it." },
  };
  
  const d = data[choice];
  const isHigh = d?.quality === "high";

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item5a');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge
              correct={isHigh}
              label={isHigh ? "Strong judgment" : d?.quality === "mid" ? "Getting there" : "Room to grow"}
            />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">{d?.text}</p>
            <p className="text-gray-600 text-sm italic">{d?.insight}</p>
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

export default Item4Reveal;