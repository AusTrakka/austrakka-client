// TODO: Need to move this function else where as it is more than a utility

import type { DataTableFilterMeta } from 'primereact/datatable';
import { type SetStateAction, useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { isDataTableFiltersEqual } from './filterUtils';
import getQueryParamOrDefault from './navigationUtils';
import { encodeFilterObj, getFilterObjFromSearchParams, getRawQueryParams } from './urlUtils';

export function useStateFromSearchParamsForPrimitive<
  T extends string | number | boolean | null | Array<string | number | boolean | null>,
>(
  paramName: string,
  defaultState: T,
  navigate: NavigateFunction,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const initCurrentSearchParams = getRawQueryParams(window.location.search);
  const stateSearchParams = getQueryParamOrDefault<T>(
    paramName,
    defaultState,
    initCurrentSearchParams,
  );
  const [state, setState] = useState<T>(stateSearchParams);

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    if (JSON.stringify(stateSearchParams) !== JSON.stringify(state)) {
      setState(stateSearchParams);
    }
  }, [stateSearchParams]);
  const useStateWithQueryParam = (newState: React.SetStateAction<T>) => {
    setState(newState);

    const currentSearchParams = getRawQueryParams(window.location.search);

    // Delete existing key
    if (paramName in currentSearchParams) {
      delete currentSearchParams[paramName];
    }

    // Append only if value is not the default
    if (newState !== defaultState) {
      currentSearchParams[paramName] = String(newState); // Raw string
    }

    const queryString = Object.entries(currentSearchParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    navigate(`${window.location.pathname}?${queryString}`, { replace: true });
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  return [state, useMemo(() => useStateWithQueryParam, [paramName, defaultState, setState])];
}

// TODO: Need to move this function else where as it is more than a utillitiy
export function useStateFromSearchParamsForObject<T extends Record<string, any>>(
  defaultState: T,
  navigate: NavigateFunction,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const stateSearchParams = getRawQueryParams(window.location.search);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    // Stringify and compare to avoid reference inequality in objects
    if (JSON.stringify(state) !== JSON.stringify(stateObject)) {
      setStateObject(state);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  }, [state]);

  const useStateWithQueryParam = (newState: React.SetStateAction<T>) => {
    setStateObject(newState);
    // const currentSearchParams = new URLSearchParams(window.location.search);
    const currentSearchParams = new Map<string, string>();

    const rawParams = getRawQueryParams(window.location.search);
    Object.entries(rawParams).forEach(([key, value]) => {
      currentSearchParams.set(key, value);
    });

    Object.entries(newState).forEach(([key, value]) => {
      // If the key exists, delete it
      if (currentSearchParams.has(key)) {
        currentSearchParams.delete(key);
      }

      // If the value differs from the default, re-add it
      if (key in defaultState && value !== defaultState[key as keyof typeof state]) {
        if (Array.isArray(value) && value.length === 0) {
          currentSearchParams.set(key, ',');
        } else {
          currentSearchParams.set(key, String(value));
        }
      }
    });

    // Convert back to a query string (raw, not encoded)
    const queryString = Array.from(currentSearchParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    navigate(`${window.location.pathname}?${queryString}`, { replace: true });
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  return [stateObject, useMemo(() => useStateWithQueryParam, [defaultState, setStateObject])];
}

function resolveState(
  newState: SetStateAction<DataTableFilterMeta>,
  currentState: DataTableFilterMeta,
): DataTableFilterMeta {
  if (typeof newState === 'function') {
    // If it's a function, call it with the current state
    return (newState as (prevState: DataTableFilterMeta) => DataTableFilterMeta)(currentState);
  }
  // If it's not a function, it's already the new state
  return newState;
}

// TODO: Need to move this function else where as it is more than a utility
export function useStateFromSearchParamsForFilterObject(
  paramName: string,
  defaultFilter: DataTableFilterMeta,
): [DataTableFilterMeta, React.Dispatch<React.SetStateAction<DataTableFilterMeta>>] {
  // biome-ignore lint/correctness/useExhaustiveDependencies: <need the url>
  const stateSearchParams = useMemo(() => {
    return getFilterObjFromSearchParams(paramName, defaultFilter);
  }, [paramName, defaultFilter, window.location.search]);

  const [state, setState] = useState<DataTableFilterMeta>(stateSearchParams);

  // Sync URL -> State: covers real browser back/forward, and any other
  // code that mutates history (native popstate only, not our own writes below)
  useEffect(() => {
    const onPopState = () => {
      const next = getFilterObjFromSearchParams(paramName, defaultFilter);
      setState((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [paramName, defaultFilter]);

  useEffect(() => {
    if (JSON.stringify(stateSearchParams) !== JSON.stringify(state)) {
      setState(stateSearchParams);
    }
  }, [stateSearchParams, state]);

  // Sync State -> URL, bypassing the router entirely
  const useStateWithQueryParam = (newState: React.SetStateAction<DataTableFilterMeta>) => {
    const resolvedState = resolveState(newState, state);
    if (JSON.stringify(resolvedState) === JSON.stringify(state)) {
      return;
    }
    setState(resolvedState);

    const rawParams = getRawQueryParams(window.location.search);
    if (paramName in rawParams) delete rawParams[paramName];
    if (!isDataTableFiltersEqual(resolvedState, defaultFilter)) {
      rawParams[paramName] = encodeFilterObj(resolvedState);
    }
    const queryString = Object.entries(rawParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState(window.history.state, '', newUrl);
  };

  return [state, useStateWithQueryParam];
}
