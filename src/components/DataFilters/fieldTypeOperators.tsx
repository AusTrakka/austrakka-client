import { FilterMatchMode } from 'primereact/api';
import FilteringOperators from '../../constants/filteringOperators';

export const stringConditions = [
  { value: FilteringOperators.CONTAINS, name: 'Contains' },
  { value: FilteringOperators.NOT_CONTAINS, name: 'Doesn\'t Contain' },
  { value: FilteringOperators.EQUALS, name: 'Equals' },
  { value: FilteringOperators.NOT_EQUAL, name: 'Doesn\'t Equal' },
  { value: FilteringOperators.STARTS_WITH, name: 'Starts With' },
  { value: FilteringOperators.ENDS_WITH, name: 'Ends With' },
  { value: FilteringOperators.NULL, name: 'Is null or empty' },
  { value: FilteringOperators.NOT_NULL, name: 'Is not null or empty' },
];

export const stringConditionsPR = [
  { value: FilterMatchMode.CONTAINS, name: 'Contains' },
  { value: FilterMatchMode.NOT_CONTAINS, name: 'Doesn\'t Contain' },
  { value: FilterMatchMode.EQUALS, name: 'Equals' },
  { value: FilterMatchMode.NOT_EQUALS, name: 'Doesn\'t Equal' },
  { value: FilterMatchMode.STARTS_WITH, name: 'Starts With' },
  { value: FilterMatchMode.ENDS_WITH, name: 'Ends With' },
];

export const dateConditions = [
  { value: FilteringOperators.EQUALS, name: 'On' },
  { value: FilteringOperators.LESS_OR_EQUAL, name: 'On and before' },
  { value: FilteringOperators.GREATER_OR_EQUAL, name: 'On and after' },
  { value: FilteringOperators.NULL, name: 'Is null or empty' },
  { value: FilteringOperators.NOT_NULL, name: 'Is not null or empty' },
];

export const dateConditionsPR = [
  { value: FilterMatchMode.DATE_IS, name: 'On' },
  { value: FilterMatchMode.DATE_BEFORE, name: 'On and before' },
  { value: FilterMatchMode.DATE_AFTER, name: 'On and after' },
  { value: FilterMatchMode.DATE_IS_NOT, name: 'Is not' },
];

export const numberConditions = [
  { value: FilteringOperators.EQUALS, name: 'Equals' },
  { value: FilteringOperators.NOT_EQUAL, name: 'Doesn\'t equal' },
  { value: FilteringOperators.LESS, name: 'Less than' },
  { value: FilteringOperators.GREATER, name: 'Greater than' },
  { value: FilteringOperators.LESS_OR_EQUAL, name: 'Less than or equal to' },
  { value: FilteringOperators.GREATER_OR_EQUAL, name: 'Greater than or equal to' },
  { value: FilteringOperators.NULL, name: 'Is null or empty' },
  { value: FilteringOperators.NOT_NULL, name: 'Is not null or empty' },
];

export const numberConditionsPR = [
  { value: FilterMatchMode.EQUALS, name: 'Equals' },
  { value: FilterMatchMode.NOT_EQUALS, name: 'Doesn\'t equal' },
  { value: FilterMatchMode.LESS_THAN, name: 'Less than' },
  { value: FilterMatchMode.GREATER_THAN, name: 'Greater than' },
  { value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO, name: 'Less than or equal to' },
  { value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO, name: 'Greater than or equal to' },
];

export const booleanConditions = [
  { value: FilteringOperators.EQUALS, name: 'Equals' },
  { value: FilteringOperators.NOT_EQUAL, name: 'Doesn\'t Equal' },
  { value: FilteringOperators.NULL, name: 'Is null or empty' },
  { value: FilteringOperators.NOT_NULL, name: 'Is not null or empty' },
];

export const booleanConditionsPR = [
  { value: FilterMatchMode.EQUALS, name: 'Equals' },
  { value: FilterMatchMode.NOT_EQUALS, name: 'Doesn\'t Equal' },
];
