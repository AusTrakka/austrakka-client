import { DataTableFilterMeta } from 'primereact/datatable';
import { NavigateFunction } from 'react-router-dom';
import { encodeFilterObj } from './urlUtils';
import { ORG_OVERVIEW_TABS } from '../components/OrganisationOverview/orgTabConstants';
import { PROJECT_OVERVIEW_TABS } from '../components/ProjectOverview/projTabConstants';

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

// Helper function to determine if the last segment matches any tab title
const shouldReplaceLastSegment =
    (lastSegment: string) =>
      ORG_OVERVIEW_TABS
        .some(tab => tab.title.toLowerCase() === lastSegment) ||
        PROJECT_OVERVIEW_TABS
          .some(tab => tab.title.toLowerCase() === lastSegment);

// Helper function to build the new path based on current path and tabs
const buildNewPath = (currentPath: string, tabUrl: string) => {
  const pathSegments = currentPath.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1].toLowerCase();

  return shouldReplaceLastSegment(lastSegment)
    ? `${pathSegments.slice(0, -1).join('/')}${tabUrl}`
    : `${currentPath}${tabUrl}`;
};

// Main function to update the tab URL with optional search filters
export const updateTabUrlWithSearch = (
  navigate: NavigateFunction,
  tabUrl: string,
  filter?: DataTableFilterMeta,
) => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  let newPath = buildNewPath(currentPath, tabUrl);

  // Add the filter query string if provided
  if (filter) {
    const encodedFilter = encodeFilterObj(filter);
    newPath += `?filters=${encodedFilter}`;
  } else {
    newPath += currentSearch;
  }

  navigate(newPath);
};
