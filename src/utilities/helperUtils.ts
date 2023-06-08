import { useEffect, useRef } from 'react';

export default function isoDateLocalDate(datetime: any) {
  const isoDate = new Date(datetime.getValue());
  const localDate = isoDate.toLocaleDateString();
  return localDate;
}

export function useFirstRender() {
  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return firstRender.current;
}
