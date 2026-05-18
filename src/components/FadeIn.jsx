/**
 * FadeIn Component - Animation utility
 * Extracted from App.jsx for reuse
 */

import React, { useState, useEffect, useRef } from 'react';

function FadeIn({ children, delay = 0, direction = 'up', duration = 600, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    up: isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    down: isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0',
    left: isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
    right: isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0',
    fade: isVisible ? 'opacity-100' : 'opacity-0'
  };

  return (
    <div
      ref={ref}
      className={`transform transition-all ease-out ${directionClasses[direction]} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

export default FadeIn;