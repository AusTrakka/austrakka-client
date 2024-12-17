import React, { useEffect, useState } from 'react';
import { Alert, Paper, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData } from 'primereact/datatable';
import { Column, ColumnEvent } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { EditOutlined } from '@mui/icons-material';
import { MetaDataColumn } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import { getFieldsV2, patchFieldV2 } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import LoadingState from '../../constants/loadingState';
import { PermissionLevel, hasPermission, hasPermissionV2 } from '../../permissions/accessTable';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { NumericEditable, TextEditable } from './EditableFields';
import { ScopeDefinitions } from '../../constants/scopes';

function Fields() {
  const [fields, setFields] = useState<MetaDataColumn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });
  const user: UserSliceState = useAppSelector(selectUserState);
  // The scope should be in scope constant file somewhere in the future.
  // So it can be synced with the backend.
  const scope = ScopeDefinitions.UPDATE_TENANT_METADATA_COLUMN;
  const interactionPermission = hasPermissionV2(user, user.defaultTenantName, scope);

  // get all AT fields
  useEffect(() => {
    const setNullsToCategorical = (inputFields: MetaDataColumn[]) => {
      inputFields.forEach((field) => {
        if (field.primitiveType === null) {
          field.primitiveType = 'categorical';
        }
      });
    };

    const retrieveFields = async () => {
      try {
        const response: ResponseObject = await getFieldsV2(user.defaultTenantGlobalId, token);
        if (response.status === ResponseType.Success) {
          const responseFields: MetaDataColumn[] = response.data;
          responseFields.sort((a, b) => a.columnOrder - b.columnOrder);
          setNullsToCategorical(responseFields);
          setFields(responseFields);
        } else if (response.status === ResponseType.Error) {
          setError(response.message);
        }
      } catch (e) {
        setError('An unexpected error occurred.');
      }
    };

    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      (async () => {
        await retrieveFields(); // Await the promise to avoid unhandled rejection warnings
      })();
    }
  }, [token, tokenLoading, user.defaultTenantGlobalId]);

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <SearchInput
          value={(globalFilter.global as DataTableFilterMetaData).value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            const filters = { ...globalFilter };
            (filters.global as DataTableFilterMetaData).value = value;
            setGlobalFilter(filters);
          }}
        />
      </div>
    </div>
  );

  const renderAllowedValues = (allowedValues: string[] | null): string => {
    if (allowedValues === null || allowedValues.length === 0) return '';
    return allowedValues.join(', ');
  };

  const cellEditor = (options: any) => {
    if (options.field === 'columnOrder') {
      return <NumericEditable value={options.value} editorCallback={options.editorCallback} />;
    }
    if (options.field === 'description') {
      return <TextEditable value={options.value} editorCallback={options.editorCallback} />;
    }
    return undefined;
  };

  const isPositiveInteger = (val: number) => {
    let str = String(val);

    str = str.trim();

    if (!str) {
      return false;
    }

    str = str.replace(/^0+/, '') || '0';
    const n = Math.floor(Number(str));

    return n !== Infinity && String(n) === str && n >= 0;
  };

  const updateField = async (data: ColumnEvent) => {
    const { rowData, field, newValue } = data;
    const fieldName = rowData.columnName;
    const fieldData = { [field]: newValue };

    const response = await patchFieldV2(user.defaultTenantGlobalId, fieldName, token, fieldData);
    if (response.status === ResponseType.Success) {
      setFields(fields.map((fieldMetadata: MetaDataColumn) =>
        (fieldMetadata.columnName === fieldName ?
          { ...fieldMetadata, ...fieldData } :
          fieldMetadata)));
    } else {
      setError(response.message);
    }
  };

  const onCellEditComplete = (e: ColumnEvent) => {
    const { rowData, newValue, field, originalEvent: event } = e;

    switch (field) {
      case 'columnOrder':
        if (isPositiveInteger(newValue)) {
          rowData[field] = newValue;
          updateField(e);
        } else event.preventDefault();
        break;

      default:
        if (newValue && newValue.trim().length > 0) {
          rowData[field] = newValue;
          updateField(e);
        } else event.preventDefault();
        break;
    }
  };

  const bodyValueWithEditIcon = (rowData: any, field: string) => (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
      {rowData[field] === null || rowData[field] === '' ? <div /> : rowData[field]}
      <EditOutlined color="disabled" fontSize="small" sx={{ marginLeft: '10px', marginRight: '10px' }} />
    </div>
  );

  const interactiveColumns = [
    {
      field: 'columnName',
      header: 'Field',
    },
    {
      field: 'description',
      header: 'Description',
      body: (rowData: any) => bodyValueWithEditIcon(rowData, 'description'),
      editable: true,
    },
    {
      field: 'primitiveType',
      header: 'Type',
    },
    {
      field: 'columnOrder',
      header: 'Ordering',
      body: (rowData: any) => bodyValueWithEditIcon(rowData, 'columnOrder'),
      editable: true,
    },
    {
      field: 'metaDataColumnValidValues',
      header: 'Allowed Values',
      body: (rowData: any) => renderAllowedValues(rowData.metaDataColumnValidValues),
    },
  ];

  const nonInteractiveColumns = [
    {
      field: 'columnName',
      header: 'Field',
    },
    {
      field: 'description',
      header: 'Description',
    },
    {
      field: 'primitiveType',
      header: 'Type',
    },
    {
      field: 'metaDataColumnValidValues',
      header: 'Allowed Values',
      body: (rowData: any) => renderAllowedValues(rowData.metaDataColumnValidValues),
    },
  ];

  const columns = interactionPermission ? interactiveColumns : nonInteractiveColumns;
  return (
    <>
      <Typography className="pageTitle">Fields</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={fields}
          size="small"
          columnResizeMode="expand"
          resizableColumns
          showGridlines
          reorderableColumns
          removableSort
          header={header}
          scrollable
          scrollHeight="calc(100vh - 300px)"
          sortIcon={sortIcon}
          paginator
          rows={25}
          rowsPerPageOptions={[25, 50, 100, 150, 500]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
          selectionMode="single"
          editMode={hasPermission(user, 'AusTrakka-Owner', 'fields', PermissionLevel.CanClick) ? 'cell' : undefined}
          filters={globalFilter}
        >
          {
            columns.map((col: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={col.body}
                editor={interactionPermission ? (options) => cellEditor(options) : undefined}
                sortable
                resizeable
                headerClassName="custom-title"
                style={{ whiteSpace: 'normal', maxWidth: '15rem' }}
                onCellEditComplete={onCellEditComplete}
                onBeforeCellEditShow={(e) => (!col.editable ?
                  e.originalEvent.preventDefault() : undefined)}
              />
            ))
}
        </DataTable>
      </Paper>
    </>
  );
}

export default Fields;
