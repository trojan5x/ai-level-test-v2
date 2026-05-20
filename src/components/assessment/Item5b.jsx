/**
 * Item5b Component - Prompt engineering question
 * Extracted from App.jsx for new navigation system
 */

import React, { useState } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import Header from '../Header.jsx';
import FadeIn from '../FadeIn.jsx';
import { useDelayedSkip } from '../../hooks/useDelayedSkip.js';

// Scoring function for prompt quality
function scorePromptFix(text) {
  const t = text.toLowerCase();
  const l3Keywords = ["closing", "close rate", "diagnose", "weakness", "pipeline", "specific", "mindset", "strategy", "lost deals", "proposal stage", "real time"];
  const l2Keywords = ["experience", "years", "industry", "focus on", "improve my", "without", "freelancer", "enterprise", "beginner"];
  let l3Count = l3Keywords.filter(k => t.includes(k)).length;
  let l2Count = l2Keywords.filter(k => t.includes(k)).length;
  if (l3Count >= 2 || t.length > 120) return 3;
  if (l2Count >= 2 || t.length > 70) return 2;
  return 1;
}

function Item5b({ assessmentContext }) {
  // Load previous answer if exists
  const previousText = assessmentContext.state?.assessment?.responses?.item5b || "";
  const [text, setText] = useState(previousText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const skipVisible = useDelayedSkip(5000);

  const handleSubmit = async () => {
    if (text.length <= 10) return;
    setIsSubmitting(true);
    
    try {
      await assessmentContext.handlers.handleItem5b(text);
    } catch (error) {
      console.error('Error submitting Item5b:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    assessmentContext.handlers.handleItem5bSkip();
  };

  const handleNext = async () => {
    const textToSubmit = text || previousText;
    if (textToSubmit.length > 10) {
      setIsSubmitting(true);
      try {
        await assessmentContext.handlers.handleItem5b(textToSubmit);
      } catch (error) {
        console.error('Error submitting Item5b:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <FadeIn>
            <div className="max-w-lg text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Fix this prompt.</h2>
              <p className="text-gray-500 text-sm">Someone typed this into ChatGPT. The response was useless. Why?</p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="max-w-lg w-full mb-6">
              <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800/60 mb-3">
                <p className="text-gray-600 text-xs mb-2 font-medium">The prompt</p>
                <p className="text-gray-300 text-sm font-mono bg-gray-800/40 rounded-xl px-4 py-3">"what are some ways to get better at sales"</p>
              </div>
              <div className="bg-gray-900/30 rounded-2xl p-5 border border-gray-800/40">
                <p className="text-gray-600 text-xs mb-2 font-medium">ChatGPT said</p>
                <p className="text-gray-500 text-sm italic leading-relaxed">
                  "Here are some ways to improve: 1. Practice active listening 2. Build rapport 3. Understand customer needs 4. Learn objection handling 5. Study successful salespeople. Keep practicing!"
                </p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="max-w-lg w-full">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs font-medium">Rewrite this prompt so ChatGPT gives a useful answer.</p>
                <span className="text-amber-400/60 text-[10px] font-medium bg-amber-400/10 px-2 py-0.5 rounded-full">This one counts</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your rewritten prompt here..."
                rows={3}
                className="w-full bg-gray-900/50 border border-gray-800/60 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-700 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700 text-xs">{text.length > 0 ? `${text.length} chars` : "A sentence or two is enough"}</span>
              </div>
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
                  "Continue →"
                )}
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </ScreenTransition>
  );
}

export default Item5b;