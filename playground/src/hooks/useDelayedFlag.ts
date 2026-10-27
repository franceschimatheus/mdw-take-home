import { useEffect, useRef, useState } from 'react';

type OptionsType = {
  delayMs?: number;
  minVisibleMs?: number;
};

// Shows a loading indicator only for waits longer than `delayMs`, and keeps it up
// for at least `minVisibleMs` once shown so fast responses don't flicker.
export function useDelayedFlag(active: boolean, { delayMs = 300, minVisibleMs = 400 }: OptionsType = {}): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    if (!visible) return;
    const remaining = minVisibleMs - (Date.now() - shownAt.current);
    const timer = setTimeout(() => setVisible(false), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [active, visible, delayMs, minVisibleMs]);

  return visible;
}
