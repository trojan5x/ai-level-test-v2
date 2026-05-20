/**
 * Item6 Component - Final follow-up question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import ProgressBar from '../ProgressBar.jsx';
import FadeIn from '../FadeIn.jsx';
import { useDelayedSkip } from '../../hooks/useDelayedSkip.js';

// Scoring function for follow-up quality  
function scoreFollowUp(text) {
  const t = text.toLowerCase();
  const l4Keywords = ["bet against", "opposite", "competitor", "disagree", "abandon", "same data"];
  const l3Keywords = ["assumption", "what if", "counterargument", "wrong", "unrealistic", "actually", "not seeing", "strongest argument", "reframe", "challenge"];
  const l2Keywords = ["morale", "specific", "numbers", "how much", "break down", "factor", "burnout", "another"];
  const l1Keywords = ["bullet", "shorter", "detail", "explain", "format", "summary"];
  if (l4Keywords.some(k => t.includes(k))) return 4;
  if (l3Keywords.filter(k => t.includes(k)).length >= 1) return 3;
  if (l2Keywords.some(k => t.includes(k))) return 2;
  return 1;
}

function Item6({ assessmentContext }) {
  // Load previous answer if exists
  const previousText = assessmentContext.state?.assessment?.responses?.item6 || "";
  const [text, setText] = useState(previousText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const skipVisible = useDelayedSkip(5000);

  // Get current path and calculate correct progress
  const path = assessmentContext.state?.navigation?.assessmentPath || "B";
  const getProgressInfo = () => {
    switch(path) {
      case "A": return { current: 8, total: 8 };    // Item6 doesn't show for Path A
      case "B": return { current: 10, total: 10 };  // Actually the last visible question
      case "C": return { current: 11, total: 12 };  // One advanced question left
      default: return { current: 10, total: 10 };
    }
  };
  const progressInfo = getProgressInfo();

  const handleSubmit = async () => {
    if (text.length <= 10) return;
    setIsSubmitting(true);

    try {
      await assessmentContext.handlers.handleItem6(text);
    } catch (error) {
      console.error('Error submitting Item6:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    assessmentContext.handlers.handleItem6Skip();
  };

  const handleNext = async () => {
    const textToSubmit = text || previousText;
    if (textToSubmit.length > 10) {
      setIsSubmitting(true);
      try {
        await assessmentContext.handlers.handleItem6(textToSubmit);
      } catch (error) {
        console.error('Error submitting Item6:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col px-6 py-8">
          <ProgressBar current={progressInfo.current} total={progressInfo.total} showStepNumbers={true} />
          <div className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto pt-4">
          <FadeIn>
            <div className="max-w-lg text-center mb-4">
              <h2 className="text-2xl font-bold mb-2">Last one. Then you'll see your results.</h2>
              <p className="text-gray-500 text-sm">You asked AI to analyze why your team's project fell behind. It said:</p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="max-w-lg w-full bg-gray-900/50 rounded-2xl p-5 border border-gray-800/60 mb-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                Your sprint underperformance likely stems from three factors: scope creep, resource constraints (two members on leave), and estimation gaps. To improve: lock requirements before sprint start, build buffer for absences, and run estimation retros. These changes should help you hit 90%+ completion next quarter.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="max-w-lg w-full">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs font-medium">What's the ONE follow-up question you'd ask?</p>
                <span className="text-blue-400/60 text-[10px] font-medium bg-blue-400/10 px-2 py-0.5 rounded-full">Separates L2 from L3</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your follow-up question here..."
                rows={2}
                className="w-full bg-gray-900/50 border border-gray-800/60 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-700 resize-none"
                disabled={isSubmitting}
              />
            </div>
          </FadeIn>
          
          {/* Navigation buttons */}
          <FadeIn delay={300} className="w-full">
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/40 w-full">
              {skipVisible ? (
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-300 transition-colors text-sm px-2 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Skip this one →
                </button>
              ) : (
                <span className="invisible text-sm px-2 py-2">Previous</span>
              )}

              <button
                onClick={handleNext}
                disabled={isSubmitting || (text.length <= 10 && previousText.length <= 10)}
                className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  !isSubmitting && ((text.length > 10) || (previousText.length > 10))
                    ? 'bg-white text-gray-950 hover:scale-[1.03] active:scale-[0.97] shadow-lg'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "See my results →"
                )}
              </button>
            </div>
          </FadeIn>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default Item6;