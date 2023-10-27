enum FilteringOperators {
  EQUALS = '=',
  NOT_EQUAL = '!=',
  CONTAINS = '@=',
  NOT_CONTAINS = '!@=',
  STARTS_WITH = 'starts',
  ENDS_WITH = 'ends',
  NULL = '=NULL',
  NOT_NULL = '!=NULL',
  LESS = '<',
  GREATER = '>',
  LESS_OR_EQUAL = '<=',
  GREATER_OR_EQUAL = '>=',
}
export default FilteringOperators;
