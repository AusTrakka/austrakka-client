import { FilterMatchMode } from 'primereact/api';
import { DataTableFilterMetaData, DataTableOperatorFilterMetaData } from 'primereact/datatable';

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

// TODO: WILL NEED TO TEST THIS NOW
export function isOperatorFilterMetaData(
  value: DataTableFilterMetaData | DataTableOperatorFilterMetaData,
):
    value is DataTableOperatorFilterMetaData {
  return 'operator' in value && 'constraints' in value;
}
