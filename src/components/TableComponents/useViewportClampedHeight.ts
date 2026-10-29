import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  bottomPadding?: number;
  recalcDeps?: React.DependencyList;
}

/**
 * Custom hook to calculate and clamp a container's height based on
 * available viewport space, preventing it from overflowing the screen.
 */
export function useViewportClampedHeight<T extends HTMLElement>({
  bottomPadding = 16,
  recalcDeps = [],
}: Options = {}) {
  const ref = useRef<T>(null);
  const [tableHeight, setTableHeight] = useState<number>();

  // Calculates the maximum allowable height based on the element's position and viewport size
  const recalculate = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // GUARD: If the element (or a parent) is hidden (e.g., inside an inactive tab),
    // offsetParent will be null. Skip recalculation to prevent ghost state updates.
    if (el.offsetParent === null) return;

    // Get the element's current position relative to the visible viewport
    const { top } = el.getBoundingClientRect();

    // Use visualViewport if available (handles mobile pinch-zoom/keyboards), fallback to window height
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    // Clamp top to 0: prevents height calculations from breaking if the user scrolls past the top of the element
    const effectiveTop = Math.max(0, top);

    // Compute remaining vertical space minus the safety bottom padding
    const cap = Math.max(0, viewportHeight - effectiveTop - bottomPadding);

    // State deduplication: only update if the height value actually changed to prevent render loops
    setTableHeight((current) => (current === cap ? current : cap));
  }, [bottomPadding]);

  useEffect(() => {
    let frameId: number;

    // Throttles resize events to match the browser's paint cycle:
    // 1. cancelAnimationFrame drops any outdated, pending calculation.
    // 2. requestAnimationFrame queues the latest calculation right before the next frame paints.
    const handleResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(recalculate);
    };

    // Trigger initial calculation and bind window resize listener
    recalculate();
    window.addEventListener('resize', handleResize);

    // Set up a ResizeObserver to catch internal layout shifts (like rows expanding or collapsing)
    const containerEl = ref.current;
    const observer = containerEl ? new ResizeObserver(handleResize) : undefined;
    if (containerEl && observer) observer.observe(containerEl);

    // Clean up event listeners, pending animation frames, and observers on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [recalculate, ...recalcDeps]);

  return { ref, tableHeight };
}
