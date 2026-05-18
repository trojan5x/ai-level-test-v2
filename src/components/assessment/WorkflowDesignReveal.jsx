/**
 * WorkflowDesignReveal Component - Reveal screen for workflow design question
 * Based on modified-flow.jsx implementation
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import ResultBadge from '../ResultBadge.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function WorkflowDesignReveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const choice = state.assessment.responses.workflowDesign;
  
  const data = {
    A: { quality: "low", text: "You're using AI as a ghost writer. Efficient, but you lose control of the thinking.", insight: "The report will sound like AI because AI did all the thinking. Your judgment never entered the process." },
    B: { quality: "mid", text: "Smart division — you kept the hardest thinking for yourself. But the workflow is still serial: you → AI → you.", insight: "The next step is designing the handoffs so AI's work feeds directly into your judgment points." },
    C: { quality: "high", text: "That's a real pipeline. Each step feeds the next, and you're at the control points that matter.", insight: "You're thinking like a systems designer, not a prompt engineer. That's the L4-L5 shift." },
    D: { quality: "top", text: "You mapped capabilities to tasks, built in quality gates, and designed for iteration. That's workflow architecture.", insight: "Most people never think about where AI's judgment should override theirs — you designed for it." },
  };
  
  const d = data[choice] || data.A;
  const isHigh = d.quality === "high" || d.quality === "top";

  const handleContinue = () => {
    assessmentContext.handlers.handleRevealContinue('systemBuilder');
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <ResultBadge correct={isHigh} label={isHigh ? "Workflow architect" : "Getting there"} />
            <p className="text-gray-300 text-lg leading-relaxed mb-3">{d.text}</p>
            <p className="text-gray-600 text-sm italic">{d.insight}</p>
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

export default WorkflowDesignReveal;