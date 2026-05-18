/**
 * Item3b Component - Agreement Trap Test
 * Tests if user catches "yes-man" AI responses
 * Only shown on Path B and C (intermediate+ users)
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';

function Item3b({ assessmentContext }) {
  const [selectedChoice, setSelectedChoice] = useState(null);

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 8, total: 8 };    // Item3b doesn't show for Path A
      case "B": return { current: 8, total: 10 };   // After Item3, before Item4
      case "C": return { current: 8, total: 12 };   // After Item3, before Item4
      default: return { current: 8, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

  const handleAnswer = (choice) => {
    setSelectedChoice(choice);
    
    // Auto-advance after selection (with small delay)
    setTimeout(() => {
      assessmentContext.handlers.handleItem3b(choice);
    }, 800);
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-4">
          <ProgressBar 
            current={progressInfo.current} 
            total={progressInfo.total} 
            path={path}
            showStepNumbers={true} 
          />

          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
            <FadeIn delay={200} direction="fade">
              <div className="text-center mb-6">
                <p className="text-blue-400/50 text-xs font-medium mb-2">Critical thinking check</p>
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Which response shows better judgment?</h2>
                <p className="text-gray-500 text-sm">You asked AI: "Our competitor just launched a feature we've had for 6 months. Should we be worried?"</p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <FadeIn delay={300} direction="up">
                <button
                  onClick={() => handleAnswer("A")}
                  className={`group text-left p-5 rounded-2xl border transition-all duration-300 w-full hover:scale-[1.01] hover:shadow-lg ${
                    selectedChoice === "A"
                      ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
                      : 'border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 hover:shadow-blue-500/10'
                  }`}
                >
                  <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest transition-colors group-hover:text-blue-400/80">A</div>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                    You're right to not worry. Since you've had this feature for 6 months, you have a significant head start. Your users are already familiar with it, and your competitor is playing catch-up. Focus on staying ahead with your next innovation rather than looking backward. Your first-mover advantage is real.
                  </p>
                  {selectedChoice === "A" && (
                    <div className="mt-3 text-blue-400 text-sm flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      Selected
                    </div>
                  )}
                </button>
              </FadeIn>
              <FadeIn delay={450} direction="up">
                <button
                  onClick={() => handleAnswer("B")}
                  className={`group text-left p-5 rounded-2xl border transition-all duration-300 w-full hover:scale-[1.01] hover:shadow-lg ${
                    selectedChoice === "B"
                      ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
                      : 'border-gray-800/60 bg-gray-900/50 hover:border-blue-500/50 hover:bg-gray-900 hover:shadow-blue-500/10'
                  }`}
                >
                  <div className="text-blue-400/60 text-xs font-semibold mb-3 tracking-widest transition-colors group-hover:text-blue-400/80">B</div>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                    The question isn't whether they copied you — it's whether their version is better positioned. Having a feature first doesn't mean you own it. How are your retention numbers on that feature? If usage is flat after 6 months, their fresh launch with better marketing might actually leapfrog you. What does your usage data say?
                  </p>
                  {selectedChoice === "B" && (
                    <div className="mt-3 text-blue-400 text-sm flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      Selected
                    </div>
                  )}
                </button>
              </FadeIn>
            </div>

            <FadeIn delay={1200} direction="fade">
              <div className="text-center mt-8">
                <p className="text-xs text-gray-600">
                  💡 Think about what makes a helpful AI response vs. an unhelpful one
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default Item3b;