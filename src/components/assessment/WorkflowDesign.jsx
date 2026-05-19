/**
 * WorkflowDesign Component - Advanced Workflow Assessment (Path C)
 * 20-page report workflow design scenario for expert users
 * Tests system thinking and workflow orchestration
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function WorkflowDesign({ assessmentContext }) {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleAnswer = (choice) => {
    setSelectedChoice(choice);
  };

  const handleNext = () => {
    if (selectedChoice) {
      assessmentContext.handlers.handleWorkflowDesign(selectedChoice);
    }
  };

  const scenario = "You're writing a 20-page report with research, data analysis, writing, and editing. You have access to AI tools. How would you structure the workflow?";

  const approaches = [
    {
      id: "A",
      text: "Ask AI to write the full report, then edit it myself.",
      signal: "low"
    },
    {
      id: "B", 
      text: "Break it into sections. Use AI for research and first drafts, then rewrite the analysis myself.",
      signal: "mid"
    },
    {
      id: "C",
      text: "Design a pipeline: AI researches → I outline the argument → AI drafts sections from my outline → I edit for voice and accuracy → AI formats.",
      signal: "high"
    },
    {
      id: "D",
      text: "Map which parts AI is best at (research, formatting, data) vs which need my judgment (argument, framing, conclusions). Build a workflow with checkpoints where I review AI output before it feeds into the next step.",
      signal: "top"
    }
  ];

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-4">
          <ProgressBar 
            current={11} 
            total={12} 
            path="C"
            showStepNumbers={true} 
          />

          <div className="flex-1 flex flex-col pt-4 max-w-3xl mx-auto w-full">
            <FadeIn delay={200} direction="fade">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-3">
                  <span className="text-purple-400 text-[10px] font-semibold tracking-wider">ADVANCED</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3">How would you design this?</h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto">{scenario}</p>
              </div>
            </FadeIn>

            <div className="grid gap-4">
              {approaches.map((approach, index) => (
                <FadeIn key={approach.id} delay={700 + (index * 150)} direction="up">
                  <button
                    onClick={() => handleAnswer(approach.id)}
                    className={`group text-left p-5 rounded-2xl border transition-all duration-500 w-full hover:scale-[1.01] hover:shadow-lg ${
                      selectedChoice === approach.id
                        ? 'border-purple-500 bg-purple-500/10 shadow-purple-500/20'
                        : 'border-gray-800/60 bg-gray-900/50 hover:border-purple-500/50 hover:bg-gray-900 hover:shadow-purple-500/10'
                    }`}
                  >
                    <div className="text-purple-400/60 text-xs font-semibold mb-3 tracking-widest transition-colors group-hover:text-purple-400/80">
                      {approach.id}
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed text-sm group-hover:text-gray-200 transition-colors duration-300">
                      {approach.text}
                    </p>
                    
                    {selectedChoice === approach.id && (
                      <div className="mt-4 text-purple-400 text-sm flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        Selected
                      </div>
                    )}
                  </button>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={1400} direction="fade">
              <div className="text-center mt-8">
                <p className="text-xs text-gray-600">
                  🎯 Think about scalability, quality control, and human oversight
                </p>
              </div>
            </FadeIn>
            {/* Navigation buttons */}
            <FadeIn delay={100} className="w-full">
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full max-w-3xl mx-auto">
                <button
                  onClick={() => assessmentContext.updateUrl('item5bReveal')}
                  className="invisible flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={!selectedChoice}
                  className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                    selectedChoice
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

export default WorkflowDesign;