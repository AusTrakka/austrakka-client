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
    if (value === ',') {
      return [] as T;
    }
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

export default function getQueryParamOrDefault<T>(
  paramName: string | number | symbol,
  defaultState: T,
  searchParams: URLSearchParams,
): T {
  const paramValue = searchParams.get(String(paramName));
  return parse(paramValue, defaultState);
}
