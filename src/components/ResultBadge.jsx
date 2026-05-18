/**
 * ResultBadge Component - Assessment result indicator
 * Extracted from App.jsx for reuse
 */

import React from 'react';

function ResultBadge({ correct, label }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${correct
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
      }`}>
      <span className="text-lg">{correct ? "✦" : "✧"}</span>
      {label}
    </div>
  );
}

export default ResultBadge;