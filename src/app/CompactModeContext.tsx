import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface CompactModeContextValue {
  compact: boolean;
  toggleCompact: () => void;
  setCompact: (value: boolean) => void;
}

const CompactModeContext = createContext<CompactModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'ui:compact-mode';

export function CompactModeProvider({ children }: { children: React.ReactNode }) {
  const [compact, setCompactState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(compact));
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }, [compact]);

  const toggleCompact = useCallback(() => setCompactState((prev) => !prev), []);
  const setCompact = useCallback((value: boolean) => setCompactState(value), []);

  const value = useMemo<CompactModeContextValue>(
    () => ({
      compact,
      toggleCompact,
      setCompact,
    }),
    [compact, toggleCompact, setCompact],
  );

  return <CompactModeContext.Provider value={value}>{children}</CompactModeContext.Provider>;
}

export function useCompactMode() {
  const ctx = useContext(CompactModeContext);
  if (!ctx) {
    throw new Error('useCompactMode must be used within a CompactModeProvider');
  }
  return ctx;
}

/**
 * The scoped wrapper. Apply this once, high in the tree, inside your
 * existing MUI ThemeProvider / Redux Provider / etc. Everything below it
 * — MUI, PrimeReact, custom components — inherits the CSS vars.
 */
export function AppContainer({ children }: { children: React.ReactNode }) {
  const { compact } = useCompactMode();

  return <div className={`app-container${compact ? ' compact-mode' : ''}`}>{children}</div>;
}
