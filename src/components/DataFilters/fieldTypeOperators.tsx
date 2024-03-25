import { FilterMatchMode } from 'primereact/api';

export enum CustomFilterOperators {
  NULL_OR_EMPTY = 'null_or_empty',
  NOT_NULL_OR_EMPTY = 'not_null_or_empty'
}

export const stringConditions = [
  { value: FilterMatchMode.CONTAINS, name: 'Contains' },
  { value: FilterMatchMode.NOT_CONTAINS, name: 'Doesn\'t Contain' },
  { value: FilterMatchMode.EQUALS, name: 'Equals' },
  { value: FilterMatchMode.NOT_EQUALS, name: 'Doesn\'t Equal' },
  { value: FilterMatchMode.STARTS_WITH, name: 'Starts With' },
  { value: FilterMatchMode.ENDS_WITH, name: 'Ends With' },
  { value: CustomFilterOperators.NULL_OR_EMPTY, name: 'Is null or empty' },
  { value: CustomFilterOperators.NOT_NULL_OR_EMPTY, name: 'Is not null or empty' },
];

export const dateConditions = [
  { value: FilterMatchMode.DATE_IS, name: 'On' },
  { value: FilterMatchMode.DATE_BEFORE, name: 'On and before' },
  { value: FilterMatchMode.DATE_AFTER, name: 'On and after' },
  { value: FilterMatchMode.DATE_IS_NOT, name: 'Is not' },
];

export const numberConditions = [
  { value: FilterMatchMode.EQUALS, name: 'Equals' },
  { value: FilterMatchMode.NOT_EQUALS, name: 'Doesn\'t equal' },
  { value: FilterMatchMode.LESS_THAN, name: 'Less than' },
  { value: FilterMatchMode.GREATER_THAN, name: 'Greater than' },
  { value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO, name: 'Less than or equal to' },
  { value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO, name: 'Greater than or equal to' },
];

export const booleanConditions = [
  { value: FilterMatchMode.EQUALS, name: 'Equals' },
  { value: FilterMatchMode.NOT_EQUALS, name: 'Doesn\'t Equal' },
];
