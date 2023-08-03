import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getQueryParamOrDefault from './navigationUtils';

export default function isoDateLocalDate(datetime: any) {
  let isoDate = null;
  if (datetime.getValue === 'function') {
    if (datetime.getValue() === null) {
      return null;
    }

    isoDate = new Date(datetime.getValue());
  } else {
    isoDate = new Date(Date.parse(datetime));
  }
  isoDate = typeof datetime.getValue === 'function' ? new Date(datetime.getValue()) : new Date(Date.parse(datetime));
  const localDate = isoDate.toLocaleString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  return localDate;
}

export function isoDateLocalDateNoTime(datetime: any) {
  if (datetime?.getValue() === null) return '';
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

export function useStateFromSearchParamsForPrimitive
<T extends string | number | boolean | null | Array<string | number | boolean | null>>(
  paramName: string,
  defaultState: T,
  searchParams: URLSearchParams,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const stateSearchParams = getQueryParamOrDefault<T>(paramName, defaultState, searchParams);
  const [state, setState] = useState<T>(stateSearchParams);
  const navigate = useNavigate();
  const useStateWithQueryParam = (newState: React.SetStateAction<T>) => {
    setState(newState);
    const currentSearchParams = new URLSearchParams(window.location.search);
    // If exists in the current searchParams, delete it
    if (currentSearchParams.has(paramName)) {
      currentSearchParams.delete(paramName);
    }
    // If differs from the default, append it to searchParams
    if (newState !== defaultState) {
      currentSearchParams.append(paramName, String(newState));
    }

    // Convert searchParams to a string
    const queryString = currentSearchParams.toString();
    // Update the URL without navigating
    navigate(`${window.location.pathname}?${queryString}`, { replace: true });
  };
  return [state, useStateWithQueryParam];
}

export function useStateFromSearchParamsForObject<T extends Record<string, any>>(
  defaultState: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const stateSearchParams = new URLSearchParams(window.location.search);
  const state: T = { ...defaultState };
  Object.keys(defaultState).forEach((key) => {
    const queryValue = getQueryParamOrDefault<T[keyof T]>(
      key,
      defaultState[key],
      stateSearchParams,
    );
    if (queryValue !== undefined) {
      state[key as keyof T] = queryValue; // Cast the value to the appropriate type
    }
  });
  const [stateObject, setStateObject] = useState<T>(state);
  const navigate = useNavigate();
  const useStateWithQueryParam = (newState: React.SetStateAction<T>) => {
    setStateObject(newState);
    const currentSearchParams = new URLSearchParams(window.location.search);
    Object.entries(newState).forEach(([key, value]) => {
      // If the key exists in the current searchParams, delete it
      if (currentSearchParams.has(key)) {
        currentSearchParams.delete(key);
      }
      // If the value differs from the default, append it to searchParams
      if (key in defaultState && value !== defaultState[key as keyof typeof state]) {
        // If the value is an empty array, append a comma to the searchParams
        if (value instanceof Array && value.length === 0) {
          currentSearchParams.append(key, ',');
        } else {
          currentSearchParams.append(key, String(value));
        }
      }
    });
    // Convert searchParams to a string
    const queryString = currentSearchParams.toString();
    // Update the URL without navigating
    navigate(`${window.location.pathname}?${queryString}`, { replace: true });
  };
  return [stateObject, useStateWithQueryParam];
}
