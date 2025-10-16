import { FilterMatchMode } from 'primereact/api';
import { DataTableFilterMeta, DataTableFilterMetaData, DataTableOperatorFilterMetaData } from 'primereact/datatable';

export const filterMatchModeToOperator: { [key in FilterMatchMode]?: string } = {
  [FilterMatchMode.EQUALS]: '==',
  [FilterMatchMode.NOT_EQUALS]: '!=',
  [FilterMatchMode.GREATER_THAN]: '>',
  [FilterMatchMode.LESS_THAN]: '<',
  [FilterMatchMode.GREATER_THAN_OR_EQUAL_TO]: '>=',
  [FilterMatchMode.LESS_THAN_OR_EQUAL_TO]: '<=',
  [FilterMatchMode.CONTAINS]: '@=',
  [FilterMatchMode.STARTS_WITH]: '_=',
  [FilterMatchMode.ENDS_WITH]: '_-=',
  [FilterMatchMode.NOT_CONTAINS]: '!@=',
  [FilterMatchMode.DATE_IS]: '==',
  [FilterMatchMode.DATE_IS_NOT]: '!=',
  [FilterMatchMode.DATE_BEFORE]: '<',
  [FilterMatchMode.DATE_AFTER]: '>',
  [FilterMatchMode.BETWEEN]: undefined, // No direct match for BETWEEN
  [FilterMatchMode.CUSTOM]: undefined, // Custom might not map directly
};

export function isOperatorFilterMetaData(
  value: DataTableFilterMetaData | DataTableOperatorFilterMetaData | null | undefined,
): value is DataTableOperatorFilterMetaData {
  return !!value && typeof value === 'object' && 'operator' in value && 'constraints' in value;
}

// Generic function to create filter string in SSKV format from date filter object
export function generateDateFilterString(
  dateFilterObject: DataTableFilterMeta,
): string {
  if (Object.keys(dateFilterObject).length === 0) {
    return '';
  }

  // Assuming we're working with the first key in the dateObject
  const key = Object.keys(dateFilterObject)[0];
  const filterData = dateFilterObject[key];

  if (!filterData) {
    return '';
  }

  let dateValue: Date | undefined;
  let matchMode: FilterMatchMode | undefined;

  if (isOperatorFilterMetaData(filterData)) {
    // Handle operator type with a single constraint
    if (filterData.constraints.length > 0) {
      const constraint = filterData.constraints[0];
      dateValue = constraint.value;
      matchMode = constraint.matchMode as FilterMatchMode;
    }
  } else {
    dateValue = filterData.value;
    matchMode = filterData.matchMode as FilterMatchMode;
  }

  if (
    dateValue instanceof Date &&
      !Number.isNaN(dateValue.getTime()) && // Ensure it's a valid date
      matchMode &&
      filterMatchModeToOperator[matchMode]
  ) {
    const date = dateValue.toISOString();
    const condition = filterMatchModeToOperator[matchMode];
    return `SSKV${condition}=${key}|${date}`;
  }

  return '';
}

function isEqualFilterMetaData(
  filter1: DataTableFilterMetaData,
  filter2: DataTableFilterMetaData,
): boolean {
  return filter1.value === filter2.value && filter1.matchMode === filter2.matchMode;
}

export function
isDataTableFiltersEqual(obj1: DataTableFilterMeta, obj2: DataTableFilterMeta): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // first we could check if the keys have the same values
  if (!keys1.every(key => keys2.includes(key))) {
    return false;
  }

  if (keys1.length !== keys2.length) {
    return false;
  }

  // let's sort the keys to make sure we are comparing the same keys
  keys1.sort();
  keys2.sort();

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (isOperatorFilterMetaData(val1) && isOperatorFilterMetaData(val2)) {
      if (val1.operator !== val2.operator || val1.constraints.length !== val2.constraints.length) {
        return false;
      }
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < val1.constraints.length; i++) {
        if (!isEqualFilterMetaData(val1.constraints[i], val2.constraints[i])) {
          return false;
        }
      }
    } else if (!isOperatorFilterMetaData(val1) && !isOperatorFilterMetaData(val2)) {
      if (!isEqualFilterMetaData(val1, val2)) {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}

export function getConditionName(
  constraint: DataTableFilterMetaData,
  conditions: { value: string; name: string }[],
) {
  const found = conditions.find(c => c.value === constraint.matchMode)?.name;
  if (found) return found;

  if (constraint.matchMode === FilterMatchMode.CUSTOM) {
    if (constraint.value === true || constraint.value === 'true') return 'Null or Empty';
    if (constraint.value === false || constraint.value === 'false') return 'Not Null or Empty';
  }

  return 'Unknown';
}

// Determine how to display the value
export function getDisplayValue(
  constraint: DataTableFilterMetaData,
  conditionName: string,
  dateConditions: { value: string; name: string }[],
) {
  if (constraint.matchMode === FilterMatchMode.CUSTOM) return null;

  const raw = Array.isArray(constraint.value) ? [...constraint.value] : constraint.value;

  if (Array.isArray(raw)) return raw.join(', ');
  if (dateConditions.some(c => c.name === conditionName)) return new Date(raw).toLocaleDateString('en-CA');
  return String(raw);
}
