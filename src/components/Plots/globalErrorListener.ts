import { useEffect } from 'react';

export function useGlobalErrorListener(errorHandler: (event: ErrorEvent) => void) {
  useEffect(() => {
    const listener = (event: ErrorEvent) => {
      event.preventDefault();
      errorHandler(event);
    };

    window.addEventListener('error', listener);

    return () => {
      window.removeEventListener('error', listener);
    };
  }, [errorHandler]);
}
