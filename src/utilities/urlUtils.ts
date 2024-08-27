import { DataTableFilterMeta, DataTableFilterMetaData, DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { isOperatorFilterMetaData } from './filterUtils';
import { isISODateString } from './dateUtils';

export function encodeFilterObj(filterObj: DataTableFilterMeta): string {
  const encoded = Object.entries(filterObj)
    .map(([key, value]: [string, DataTableFilterMetaData | DataTableOperatorFilterMetaData]) => {
      if (isOperatorFilterMetaData(value)) {
        const conditions = value.constraints.map(constraint => {
          // if the value to be encoded is part of a date condition or is itself a date
          // then encode it as an ISO string
          if (constraint.value instanceof Date &&
                        !Number.isNaN(constraint.value.getTime()) &&
                        (constraint.matchMode?.includes('date') ||
                            constraint.matchMode?.includes('custom'))) {
            return `${encodeURIComponent(constraint.value.toISOString())}:${constraint.matchMode || ''}`;
          }
          return `${encodeURIComponent(constraint.value)}:${constraint.matchMode || ''}`;
        }).join(',');
        return `${encodeURIComponent(key)}:${encodeURIComponent(value.operator)}:(${conditions})`;
      }
      return `${encodeURIComponent(key)}:${encodeURIComponent(value.value)}:${value.matchMode || ''}`;
    });

  // Join the encoded pairs with commas and add parentheses
  const result = encoded.join(',');
  return `(${result})`;
}

export function decodeUrlToFilterObj(encodedString: string): DataTableFilterMeta {
  const decodedObj: DataTableFilterMeta = {};

  let cleanedString = encodedString.replace(/^%28|%29$/g, '');
  // Remove normal parentheses
  if (cleanedString.startsWith('(') && cleanedString.endsWith(')')) {
    cleanedString = cleanedString.slice(1, -1);
  }
  // Remove the outer parentheses and split on commas not within parentheses
  const pairs = cleanedString.split(/,\s*(?![^(]*\))/);
  pairs.forEach(pair => {
    const [encodedKey, ...rest] = pair.split(':');
    const key = decodeURIComponent(encodedKey);
    if (rest.length === 2) {
      const decodedValue = decodeURIComponent(rest[0]);
      decodedObj[key] = {
        value: isISODateString(decodedValue) ?
          new Date(decodedValue) :
          decodedValue,
        matchMode: rest[1] as FilterMatchMode,
      };
    } else if (rest.length > 2) {
      // Operator filter
      const operator = rest[0];
      const constraintsString = rest.slice(1).join(':');
      const constraints = constraintsString.slice(1, -1).split(/,(?![^()]*\))/); // Remove parentheses and split

      decodedObj[key] = {
        operator: operator as FilterOperator,
        constraints: constraints.map(constraint => {
          const [value, matchMode] = constraint.split(':');
          const decodedValue = decodeURIComponent(value);
          return {
            value: isISODateString(decodedValue) ?
              new Date(decodedValue) :
              decodeURIComponent(value),
            matchMode: matchMode as FilterMatchMode,
          };
        }),
      };
    }
  });
  return decodedObj;
}
