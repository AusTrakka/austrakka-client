import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';

interface NavigationContextType {
  navigate: NavigateFunction;
}

// Create a stable context value that never changes reference
const stableContextValue: NavigationContextType = {
  navigate: ((...args: any[]) => {
    throw new Error('Navigation not initialized');
  }) as NavigateFunction,
};

const NavigationContext = createContext<NavigationContextType>(stableContextValue);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const navigate = useNavigate();
  const navigateRef = useRef<NavigateFunction>(navigate);
  const isInitialized = useRef(false);

  // Update the ref when navigate changes, but don't trigger re-renders
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Initialize the stable navigate function only once
  if (!isInitialized.current) {
    stableContextValue.navigate =
        ((...args: Parameters<NavigateFunction>) =>
          navigateRef.current(...args)) as NavigateFunction;
    
    isInitialized.current = true;
  }

  return (
    <NavigationContext.Provider value={stableContextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useStableNavigate(): NavigationContextType {
  const context = useContext(NavigationContext);
  return context; // No error checking needed since we provide a stable default
}
