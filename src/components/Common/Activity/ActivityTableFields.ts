import { Field } from '../../../types/dtos';

export const EVENT_NAME_COLUMN: string = 'eventType';
export const supportedColumns: Field[] = [
  {
    columnName: EVENT_NAME_COLUMN,
    headerName: 'Event',
    metaDataColumnValidValues: null,
    metaDataColumnTypeName: 'string',
    primitiveType: 'string',
    columnOrder: 1,
    canVisualise: false,
  },
  {
    columnName: 'resourceUniqueString',
    headerName: 'Resource',
    metaDataColumnValidValues: null,
    metaDataColumnTypeName: 'string',
    primitiveType: 'string',
    columnOrder: 3,
    canVisualise: false,
  },
  {
    columnName: 'resourceType',
    headerName: 'Resource type',
    metaDataColumnValidValues: null,
    metaDataColumnTypeName: 'string',
    primitiveType: 'string',
    columnOrder: 4,
    canVisualise: false,
  },
  {
    columnName: 'eventTime',
    headerName: 'Time stamp',
    metaDataColumnValidValues: null,
    metaDataColumnTypeName: 'date',
    primitiveType: 'date',
    columnOrder: 5,
    canVisualise: false,
  },
  {
    columnName: 'submitterDisplayName',
    headerName: 'Event initiated by',
    metaDataColumnValidValues: null,
    metaDataColumnTypeName: 'string',
    primitiveType: 'string',
    columnOrder: 6,
    canVisualise: false,
  },
];
