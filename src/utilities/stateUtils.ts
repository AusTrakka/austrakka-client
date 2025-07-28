// TODO: Need to move this function else where as it is more than a utility
import React, { SetStateAction, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTableFilterMeta } from 'primereact/datatable';
import getQueryParamOrDefault from './navigationUtils';
import { encodeFilterObj, getFilterObjFromSearchParams, getRawQueryParams } from './urlUtils';
import { isDataTableFiltersEqual } from './filterUtils';

export function useStateFromSearchParamsForPrimitive<T extends
string | number | boolean | null | Array<string | number | boolean | null>>(
  paramName: string,
  defaultState: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const initCurrentSearchParams = getRawQueryParams(window.location.search);
  const stateSearchParams = getQueryParamOrDefault<T>(
    paramName,
    defaultState,
    initCurrentSearchParams,
  );
  const [state, setState] = useState<T>(stateSearchParams);
  const navigate = useNavigate();

  useEffect(() => {
    if (JSON.stringify(stateSearchParams) !== JSON.stringify(state)) {
      setState(stateSearchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return [state, useMemo(() => useStateWithQueryParam, [
    paramName,
    defaultState,
    setState,
  ]),
  ];
}

// TODO: Need to move this function else where as it is more than a utillitiy
export function useStateFromSearchParamsForObject<T extends Record<string, any>>(
  defaultState: T,
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
  const navigate = useNavigate();

  useEffect(() => {
    // Stringify and compare to avoid reference inequality in objects
    if (JSON.stringify(state) !== JSON.stringify(stateObject)) {
      setStateObject(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  return [stateObject, useMemo(() => useStateWithQueryParam, [defaultState, setStateObject])];
}

function resolveState(
  newState: SetStateAction<DataTableFilterMeta>,
  currentState: DataTableFilterMeta,
):
  DataTableFilterMeta {
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
  const stateSearchParams = getFilterObjFromSearchParams(paramName, defaultFilter);
  // This default initialisation only happens on the first render
  // Thus when the stateSearchParams changes, state here will not be updated
  const [state, setState] = useState<DataTableFilterMeta>(stateSearchParams);

  // This is why we need to use useEffect
  useEffect(() => {
    // Stringify and compare to avoid reference inequality in objects
    if (JSON.stringify(stateSearchParams) !== JSON.stringify(state)) {
      setState(stateSearchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateSearchParams]);

  const navigate = useNavigate();

  const useStateWithQueryParam = (newState: React.SetStateAction<DataTableFilterMeta>) => {
    setState(newState);
    const resolvedState = resolveState(newState, state);

    const rawParams = getRawQueryParams(window.location.search);

    // Delete existing value if present
    if (paramName in rawParams) {
      delete rawParams[paramName];
    }

    // Only add param if the filter state is not equal to the default
    if (!isDataTableFiltersEqual(resolvedState, defaultFilter)) {
      // This should return a string like 'type%3Aimage'
      rawParams[paramName] = encodeFilterObj(resolvedState);
    }

    const queryString = Object.entries(rawParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    if (queryString === '' || queryString === `${paramName}=()`) {
      navigate(window.location.pathname, { replace: true });
      return;
    }

    const newUrl = `${window.location.pathname}?${queryString}`;
    navigate(newUrl, { replace: true });
  };

  // the function we return here acts like a setter and should not be updated on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return [state, useMemo(() => useStateWithQueryParam, [paramName, defaultFilter, setState])];
}
