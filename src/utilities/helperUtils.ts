import { useEffect, useRef, useState } from 'react';
import { useQueryParamsForObject, useQueryParamsForPrimitive } from './navigationUtils';

export default function isoDateLocalDate(datetime: any) {
  let isoDate = null;
  isoDate = typeof datetime.getValue === 'function' ? new Date(datetime.getValue()) : new Date(Date.parse(datetime));
  const localDate = isoDate.toLocaleString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  return localDate;
}
export function isoDateLocalDateNoTime(datetime: any) {
  const isoDate = new Date(datetime.getValue());
  const localDate = isoDate.toLocaleString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric' });
  return localDate;
}

export function formatDate(dateUTC: any) {
  const date = new Date(dateUTC);
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: 'short' }).format(date).toString();
}

export function useFirstRender() {
  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return firstRender.current;
}

// Function to aggregate counts of objects in an array, on a certain property
export function aggregateArrayObjects(property: string, array: Array<any>) {
  const initialArray = array;
  const aggregatedCounts = [];
  const map = new Map();
  if (initialArray !== undefined) {
    for (let i = 0; i < initialArray.length; i += 1) {
      let found = false;
      for (const [key, value] of map) {
        if (key === initialArray[i][property]) {
          found = true;
          const newValue = value + 1;
          map.set(initialArray[i][property], newValue);
          break;
        }
      }
      if (!found) { map.set(initialArray[i][property], 1); }
    }

    for (const [key, value] of map) {
      const obj = { [property]: '', sampleCount: 0 };
      obj[property] = key;
      obj.sampleCount = value;
      aggregatedCounts.push(obj);
    }
  }
  return aggregatedCounts;
}

// Generic function to create filter string in SSKV format from date filter object
export function generateDateFilterString(
  dateObject: { field: string, condition: string, fieldType: string, value: any },
) {
  let filterString = '';
  if (Object.keys(dateObject).length !== 0) {
    const date = `${dateObject.value.$d.toISOString()}`;
    filterString = `SSKV${dateObject.condition}=${dateObject.field}|${date},`;
  }
  return filterString;
}

export function useStateFromSearchParamsForPrimitive<T extends string | number | boolean | null>(
  paramName: string,
  defaultState: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const searchParams = new URLSearchParams(window.location.search);
  const stateSearchParams = useQueryParamsForPrimitive<T>(paramName, defaultState, searchParams);
  return useState<T>(stateSearchParams);
}

export function useStateFromSearchParamsForObject<T extends Record<string, any>>(
  defaultState: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const searchParams = new URLSearchParams(window.location.search);
  const stateSearchParams = useQueryParamsForObject<T>(defaultState, searchParams);
  const state: T = { ...defaultState };
  Object.keys(defaultState).forEach((key) => {
    const queryValue = stateSearchParams[key as keyof T];
    if (queryValue !== undefined) {
      state[key as keyof T] = queryValue;
    }
  });
  return useState<T>(state);
}
