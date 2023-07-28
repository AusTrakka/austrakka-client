function parse<T>(value: string | null, defaultValue: T): T {
  if (value === undefined || value === null) {
    return defaultValue as T;
  }
  if (value === 'null') {
    return null as T;
  }
  const expectedType = typeof defaultValue;

  if (Array.isArray(defaultValue)) {
    // Parse as array of strings
    return value.split(',') as T;
  }
  // Parse based on the type of the corresponding key in defaultState
  switch (expectedType) {
    case 'boolean':
      return (value === 'true') as T;
    case 'number':
      return Number(value) as T;
    default:
      return value as T;
  }
}

export function useQueryParamsForPrimitive<T>(
  paramName: string,
  defaultState: T,
  searchParams: URLSearchParams,
): T {
  const paramValue = searchParams.get(paramName);
  return parse(paramValue, defaultState);
}

export function useQueryParamsForObject<T extends Record<string, any>>(
  defaultState: T,
  searchParams: URLSearchParams,
): Partial<T> {
  const result: Partial<T> = {};

  Object.keys(defaultState).forEach(key => {
    const value = searchParams.get(key);
    // Cast the value to the appropriate type
    result[key as keyof T] = parse(value, defaultState[key as keyof T]);
  });
  return result;
}
