/**
 * SelfSelect Component - Calibration Assessment
 * User estimates their AI level (L0-L6) before starting assessment
 * L6 is shown for completeness but is not awarded by this assessment
 * Creates perception gap data for results sharing
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

const LEVEL_OPTIONS = [
  {
    level: 0,
    title: "Non-User",
    description: "I haven't really used AI tools yet"
  },
  {
    level: 1,
    title: "Experimenter", 
    description: "I've tried AI a few times, but don't use it regularly"
  },
  {
    level: 2,
    title: "Functional User",
    description: "I use AI occasionally for basic tasks"
  },
  {
    level: 3,
    title: "Effective Practitioner", 
    description: "I use AI regularly and get good results"
  },
  {
    level: 4,
    title: "AI-Native Performer",
    description: "AI is integrated into how I work"
  },
  {
    level: 5,
    title: "AI-Native Builder",
    description: "I build AI systems and help others use AI"
  },
  {
    level: 6,
    title: "Pioneer",
    description: "I'm advancing the frontier — pushing what AI itself can do (not measured here)"
  }
];

function SelfSelect({ assessmentContext }) {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
  };

  const handleNext = () => {
    if (selectedLevel !== null) {
      assessmentContext.handlers.handleSelfSelect(selectedLevel);
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-4 py-2 sm:px-6 sm:py-4">
          <ProgressBar current={1} total={10} showStepNumbers={true} />

          <div className="flex-1 max-w-2xl mx-auto w-full">
            <FadeIn delay={200} direction="fade">
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-blue-400/50 text-xs font-medium mb-1">Let's start with calibration</p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Where would you put yourself?</h2>
                <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">
                  We'll compare your self-assessment to your actual test results.
                </p>
              </div>
            </FadeIn>

            <div className="space-y-2 sm:space-y-3 mb-4">
              {LEVEL_OPTIONS.map((option, index) => (
                <FadeIn key={option.level} delay={200 + (index * 30)} direction="up">
                  <button
                    onClick={() => handleLevelSelect(option.level)}
                    className={`group text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 w-full hover:scale-[1.01] ${
                      selectedLevel === option.level
                        ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
                        : 'border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                          <div className="text-blue-400/60 text-xs font-semibold tracking-widest flex-shrink-0">
                            L{option.level}
                          </div>
                          <div className="text-white font-medium group-hover:text-blue-100 transition-colors text-sm sm:text-base truncate">
                            {option.title}
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors leading-tight">
                          {option.description}
                        </p>
                      </div>
                      {selectedLevel === option.level && (
                        <div className="text-blue-400 text-lg ml-2 sm:ml-3 flex-shrink-0">✓</div>
                      )}
                    </div>
                  </button>
                </FadeIn>
              ))}
            </div>

            {/* Navigation buttons */}
            <FadeIn delay={100} className="w-full">
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full max-w-2xl mx-auto">
                <button
                  onClick={() => assessmentContext.updateUrl('landing')}
                  className="invisible flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedLevel === null}
                  className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                    selectedLevel !== null
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

export default SelfSelect;