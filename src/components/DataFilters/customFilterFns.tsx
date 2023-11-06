import FilteringOperators from '../../constants/filteringOperators';

function isNullOrEmptyFn(records: any, filterParams: any) {
  const { field } = filterParams;
  if (records[field] === '' || records[field] === null) {
    return true;
  }
  return false;
}
function isNotNullOrEmptyFn(records: any, filterParams: any) {
  const { field } = filterParams;
  if (records[field] !== '' && records[field] !== null) {
    return true;
  }
  return false;
}
function containsFn(records: any, filterParams: any) {
  const { field, value } = filterParams;
  if (records[field].toLowerCase().includes(value.toLowerCase())) {
    return true;
  }
  return false;
}
function doesNotContainFn(records: any, filterParams: any) {
  const { field, value } = filterParams;
  if (!records[field].toLowerCase().includes(value.toLowerCase())) {
    return true;
  }
  return false;
}

export const customFilterFunctions = [
  { operator: FilteringOperators.NULL, function: isNullOrEmptyFn },
  { operator: FilteringOperators.NOT_NULL, function: isNotNullOrEmptyFn },
  { operator: FilteringOperators.CONTAINS, function: containsFn },
  { operator: FilteringOperators.NOT_CONTAINS, function: doesNotContainFn },
];
