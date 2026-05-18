/**
 * TimedAdvance Component - Auto-advancing button with progress bar
 * Based on modified-flow.jsx implementation
 */

import React, { useState, useEffect, useRef } from 'react';

function TimedAdvance({ 
  onAdvance, 
  duration = 3500, // Default 3.5 seconds
  label = "Next →"
}) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);
  const startRef = useRef(Date.now());
  const frameRef = useRef(null);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1 && !doneRef.current) {
        doneRef.current = true;
        onAdvanceRef.current();
      } else if (pct < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [duration]);

  const skip = () => {
    if (!doneRef.current) {
      doneRef.current = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      onAdvanceRef.current();
    }
  };

  return (
    <button
      onClick={skip}
      className="group relative mt-6 px-8 py-3 rounded-2xl font-semibold text-sm bg-gray-800/60 text-gray-300 hover:text-white transition-colors overflow-hidden"
    >
      {/* Fill bar */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-400/30 rounded-2xl transition-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export default TimedAdvance;