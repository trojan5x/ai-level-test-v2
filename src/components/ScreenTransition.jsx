/**
 * ScreenTransition Component - Screen transition animation
 * Extracted from App.jsx for reuse
 */

import React, { useState, useEffect } from 'react';

function ScreenTransition({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

export default ScreenTransition;