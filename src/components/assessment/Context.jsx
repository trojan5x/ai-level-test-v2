/**
 * Context Component - Profile Collection (Based on Modified Flow)
 * Three personas with dynamic fields based on selection
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Context({ assessmentContext }) {
  const [persona, setPersona] = useState(null); // "student" | "professional" | "founder"
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");

  const personas = [
    { id: "student", label: "Student", emoji: "🎓" },
    { id: "professional", label: "Working Professional", emoji: "💼" },
    { id: "founder", label: "Business Owner / Freelancer", emoji: "🚀" },
  ];

  const fieldConfig = {
    student: { 
      f1: "Field of study", 
      f1ph: "e.g. Computer Science, MBA, Design", 
      f2: "College / University", 
      f2ph: "e.g. IIT Bombay, NMIMS, Christ University" 
    },
    professional: { 
      f1: "Your role", 
      f1ph: "e.g. Product Manager, Software Engineer, Marketing Lead", 
      f2: "Company", 
      f2ph: "e.g. TCS, Razorpay, Zomato" 
    },
    founder: { 
      f1: "What you do", 
      f1ph: "e.g. Run a D2C brand, Freelance designer, AI consultant", 
      f2: "Company / Brand name", 
      f2ph: "e.g. Acme Studios" 
    },
  };

  const config = persona ? fieldConfig[persona] : null;
  const canSubmit = persona && field1.trim().length >= 2 && field2.trim().length >= 2;

  const handlePersonaChange = (selectedPersona) => {
    setPersona(selectedPersona);
    setField1("");
    setField2("");
  };

  const handleSubmit = () => {
    const contextData = {
      persona,
      role: field1.trim(),
      company: field2.trim()
    };
    assessmentContext.handlers.handleContext(contextData);
  };

  const handlePrevious = () => {
    assessmentContext.updateUrl('selfSelect');
  };

  const handleNext = () => {
    if (canSubmit) {
      handleSubmit();
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          <ProgressBar current={2} total={10} showStepNumbers={true} />
          
          <FadeIn delay={200} direction="fade">
            <div className="max-w-md text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">A little about you</h2>
              <p className="text-gray-500 text-sm">This helps us personalize your results and compare you to peers in your field.</p>
            </div>
          </FadeIn>

          <div className="max-w-md w-full">
            {/* Persona Selection */}
            <FadeIn delay={300} direction="up">
              <div className="flex gap-2 mb-5">
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePersonaChange(p.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      persona === p.id
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    <span className="mr-1.5">{p.emoji}</span>{p.label}
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Dynamic Fields Based on Persona */}
            {config && (
              <FadeIn delay={400} direction="up">
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">{config.f1}</label>
                    <input
                      type="text"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      placeholder={config.f1ph}
                      autoFocus
                      className="w-full bg-gray-900/50 border border-gray-800/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">{config.f2}</label>
                    <input
                      type="text"
                      value={field2}
                      onChange={e => setField2(e.target.value)}
                      placeholder={config.f2ph}
                      className="w-full bg-gray-900/50 border border-gray-800/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-600"
                    />
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Navigation buttons */}
            <FadeIn delay={200} direction="up" className="w-full">
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canSubmit}
                  className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                    canSubmit
                      ? 'bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default Context;