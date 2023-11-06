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
export const dateConditions = [
  { value: FilteringOperators.EQUALS, name: 'On' },
  { value: FilteringOperators.LESS_OR_EQUAL, name: 'On and before' },
  { value: FilteringOperators.GREATER_OR_EQUAL, name: 'On and after' },
  { value: FilteringOperators.NULL, name: 'Is null or empty' },
  { value: FilteringOperators.NOT_NULL, name: 'Is not null or empty' },
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
export const booleanConditions = [
  { value: FilteringOperators.EQUALS, name: 'Equals' },
  { value: FilteringOperators.NOT_EQUAL, name: 'Doesn\'t Equal' },
  { value: FilteringOperators.NULL, name: 'Is null or empty' },
  { value: FilteringOperators.NOT_NULL, name: 'Is not null or empty' },
];
