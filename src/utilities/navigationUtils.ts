import { DataTableFilterMeta } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';

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

export const updateTabUrlWithSearch = (tabUrl: string, filter?: DataTableFilterMeta) => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate();

  // Split the path into segments

  // Check if the last segment is the project abbreviation
  let newPath: string;
  if (filter) {
    const encodedFilter = encodeURIComponent(JSON.stringify(filter));
    newPath = `${currentPath + tabUrl}?filters=${encodedFilter}`;
  } else {
    newPath = currentPath + tabUrl + currentSearch;
  }

  navigate(newPath);
};
