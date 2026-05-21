/**
 * Header Component - Assessment header with logo
 * Extracted from App.jsx for reuse
 */

import React from 'react';

function Header() {
  return (
    <div className="w-full bg-gray-900/60 border-b border-gray-800/40 backdrop-blur-sm py-3 z-20 relative">
      <div className="flex flex-wrap items-center gap-y-2 px-4 sm:px-8 max-w-4xl mx-auto">
        {/* LearnTube + Google — centered on mobile, left on desktop */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-start">
          <img src="/learntube-icon.svg" alt="LearnTube" className="w-7 h-7 flex-shrink-0" />
          <span className="text-white text-sm font-bold tracking-wide">LearnTube.ai</span>
          <span className="text-gray-700 text-xs mx-0.5">|</span>
          <img src="/backed-by-google.png" alt="Google for Startups" className="h-5 opacity-80" />
        </div>

        {/* In partnership with ImagiNxt — centered on mobile (row 2), right on desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end sm:ml-auto">
          <span className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">In partnership with</span>
          <img src="/imaginxt-2026-logo.png" alt="ImagiNxt" className="h-7 opacity-85" />
        </div>
      </div>
    </div>
  );
}

export default Header;