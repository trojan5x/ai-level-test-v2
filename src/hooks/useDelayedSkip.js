import { useState, useEffect } from 'react';

export function useDelayedSkip(delayMs = 5000) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  return visible;
}
