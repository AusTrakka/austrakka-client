export function useQueryParamsForPrimitive<T>(
  paramName: string,
  defaultState: T,
  searchParams: URLSearchParams,
): T {
  const paramValue = searchParams.has(paramName) ? searchParams.get(paramName) : undefined;
  if (paramValue === undefined || paramValue === defaultState) {
    return defaultState;
  }
  if (paramValue === null) {
    return null as unknown as T;
  }

  // Cast the value to the appropriate type
  switch (typeof defaultState) {
    case 'number':
      return parseFloat(paramValue) as unknown as T;
    default:
      return paramValue as unknown as T;
  }
}

export function useQueryParamsForObject<T extends Record<string, any>>(
  defaultState: T,
  searchParams: URLSearchParams,
): Partial<T> {
  const result: Partial<T> = {};

  Object.keys(defaultState).forEach(key => {
    const value = searchParams.get(key);
    if (value !== null) {
      // Cast the value to the appropriate type
      switch (typeof defaultState[key as keyof T]) {
        case 'string':
          result[key as keyof T] = value as unknown as T[keyof T];
          break;
        case 'number':
          result[key as keyof T] = parseFloat(value) as unknown as T[keyof T];
          break;
        default:
          // No-op for other types. Adjust this if you want to support other types.
          break;
      }
    }
  });
  return result;
}
