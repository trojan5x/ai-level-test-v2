/**
 * Item5bReveal Component - Reveal screen for prompt engineering question
 * Extracted from App.jsx for new navigation system
 */

import React from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import TimedAdvance from '../TimedAdvance.jsx';

function Item5bReveal({ assessmentContext }) {
  const { state } = assessmentContext;
  const level = state.assessment.scores.promptLevel || 1;
  
  const msgs = {
    1: { text: "That's still treating ChatGPT like Google — type a question, get a generic answer.", sub: "The magic starts when you tell it who you are and what you're actually stuck on." },
    2: { text: "Now the AI has context. It knows what to ignore and what to dig into.", sub: "That's the difference between a generic answer and a useful one." },
    3: { text: "You're using AI as a thinking partner, not a fact machine.", sub: "That shift is where most people never get to." },
  };
  const m = msgs[level] || msgs[1];
  const bars = [
    { label: "Basic", active: level >= 1 },
    { label: "Contextual", active: level >= 2 },
    { label: "Strategic", active: level >= 3 },
  ];

  const handleContinue = () => {
    // Determine next screen based on assessment path
    const path = assessmentContext.state?.navigation?.assessmentPath || "B";
    let nextScreen = 'item6'; // Default for Path A & B
    
    if (path === "C") {
      nextScreen = 'workflowDesign'; // Path C goes to workflow design first
    }
    
    assessmentContext.handlers.handleRevealContinue(nextScreen);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <FadeIn>
          <div className="max-w-md text-center">
            <p className="text-gray-600 text-xs font-medium tracking-widest uppercase mb-4">Your prompt quality</p>
            <div className="flex gap-1.5 justify-center mb-2">
              {bars.map((b, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${b.active ? "bg-blue-500 w-20" : "bg-gray-800 w-16"
                    }`}
                />
              ))}
            </div>
            <div className="flex justify-between max-w-[240px] mx-auto mb-8">
              {bars.map((b, i) => (
                <span key={i} className={`text-xs ${b.active ? "text-blue-400" : "text-gray-700"}`}>{b.label}</span>
              ))}
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-2">{m.text}</p>
            <p className="text-gray-600 text-sm italic">{m.sub}</p>
            <TimedAdvance 
              onAdvance={handleContinue}
              duration={3500}
              label="Almost done →"
            />
          </div>
        </FadeIn>
      </div>
    </ScreenTransition>
  );
}

export default Item5bReveal;