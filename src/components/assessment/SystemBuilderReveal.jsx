/**
 * SystemBuilderReveal Component - Reveal screen for system builder question
 * Based on modified-flow.jsx implementation
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function SystemBuilderReveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const score = state.assessment.enhancedScores?.systemBuilderScore || 0;
  
  const msgs = {
    0: { text: "You haven't built AI systems yet — and that's completely fine at this stage.", sub: "The builder mindset comes after you've mastered the user mindset. You're on the path." },
    1: { text: "You've started building reusable patterns. That's the first step from user to builder.", sub: "Templates and saved instructions are where everyone starts. The next step is connecting tools together." },
    2: { text: "You're building real systems — custom tools and multi-step workflows.", sub: "You're past the 'power user' stage. You're designing how AI fits into work, not just using it." },
    3: { text: "You're an orchestrator. You build systems that run, that others use, that multiply output.", sub: "This is the L4-L5 territory. Most people will never get here." },
    4: { text: "You're building at the infrastructure level. APIs, integrations, custom tooling.", sub: "You're not just using AI — you're extending it. This is frontier territory." },
  };
  
  const m = msgs[Math.min(score, 4)];

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('item6');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={score >= 2} label={score >= 3 ? "System builder" : score >= 2 ? "Building blocks" : "Foundation laid"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-2">{m.text}</p>
            <p className="text-gray-600 text-sm italic">{m.sub}</p>
            <TimedAdvance 
              onAdvance={handleContinue}
              duration={3500}
              label="See my results →"
            />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

export default SystemBuilderReveal;