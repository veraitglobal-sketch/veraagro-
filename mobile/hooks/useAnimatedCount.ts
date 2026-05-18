import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Pause between each integer (ms). Default 220 — visible 0 → 1 → 2 … */
  stepMs?: number;
  /** Cap total animation time when target is large. */
  maxDurationMs?: number;
  /** When false, jumps straight to target. */
  animate?: boolean;
};

/**
 * Steps through each integer (0, 1, 2, …) so every value is readable.
 */
export function useAnimatedCount(target: number, options?: Options) {
  const stepMs = options?.stepMs ?? 220;
  const maxDurationMs = options?.maxDurationMs ?? 3200;
  const animate = options?.animate !== false;
  const safeTarget = Math.max(0, Math.round(Number.isFinite(target) ? target : 0));
  const displayRef = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animate) {
      displayRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }

    const from = displayRef.current;
    const to = safeTarget;
    if (from === to) return;

    const steps = Math.abs(to - from);
    const direction = to > from ? 1 : -1;
    const totalDuration = Math.min(steps * stepMs, maxDurationMs);
    const intervalMs = steps > 0 ? Math.max(140, totalDuration / steps) : stepMs;

    let current = from;
    const timer = setInterval(() => {
      current += direction;
      displayRef.current = current;
      setDisplay(current);
      if (current === to) {
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [safeTarget, animate, stepMs, maxDurationMs]);

  return display;
}
