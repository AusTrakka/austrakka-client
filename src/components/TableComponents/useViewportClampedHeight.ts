import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  bottomPadding?: number;
  recalcDeps?: unknown[];
}

export function useViewportClampedHeight<T extends HTMLElement>({
  bottomPadding = 16,
  recalcDeps = [],
}: Options = {}) {
  const ref = useRef<T>(null);
  const [tableHeight, setTableHeight] = useState<number | undefined>(undefined);

  const recalculate = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const { top } = el.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const cap = Math.max(0, viewportHeight - top - bottomPadding);

    const previousHeight = el.style.height;
    el.style.height = '';
    const naturalHeight = el.scrollHeight;
    el.style.height = previousHeight;

    setTableHeight(naturalHeight > cap ? cap : undefined);
  }, [bottomPadding]);

  useEffect(() => {
    recalculate();
    window.addEventListener('resize', recalculate);

    const bodyEl = ref.current?.querySelector('.p-datatable-tbody');
    const observer = bodyEl ? new ResizeObserver(() => recalculate()) : undefined;
    if (bodyEl && observer) observer.observe(bodyEl);

    return () => {
      window.removeEventListener('resize', recalculate);
      observer?.disconnect();
    };
  }, [recalculate, ...recalcDeps]);

  return { ref, tableHeight };
}
