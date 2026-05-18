/**
 * Header Component - Assessment header with logo
 * Extracted from App.jsx for reuse
 */

import React from 'react';

function Header() {
  return (
    <div className="w-full bg-gray-900/60 border-b border-gray-800/40 backdrop-blur-sm py-4 z-20 relative">
      <div className="flex items-center justify-center">
        {/* LearnTube Logo */}
        <div className="inline-flex items-center gap-3 px-6 py-2">
          <img
            src="/learntube-icon.svg"
            alt="LearnTube"
            className="w-8 h-8 flex-shrink-0"
          />
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-bold tracking-wider">LearnTube.ai</span>
            <span className="text-gray-700 text-sm">|</span>
            <img src="/imaginxt-logo.avif" alt="ImagiNxt" className="h-7 opacity-85" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;