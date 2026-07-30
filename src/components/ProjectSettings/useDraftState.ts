import { useEffect, useRef, useState } from 'react';
import { deepEqual } from 'vega-lite';

export function useDraftState<T extends object>(canonical: T) {
  const [draft, setDraft] = useState<T>(canonical);
  const lastCanonical = useRef<T>(canonical);

  useEffect(() => {
    if (!deepEqual(canonical, lastCanonical.current)) {
      setDraft(canonical);
      lastCanonical.current = canonical;
    }
  }, [canonical]);

  const isDirty = !deepEqual(draft, canonical);

  const diff = (Object.keys(draft) as Array<keyof T>).reduce(
    (acc, key) => {
      if (!deepEqual(draft[key], canonical[key])) {
        acc[key] = draft[key];
      }
      return acc;
    },
    {} as Partial<T>,
  );

  return { draft, setDraft, isDirty, diff };
}
