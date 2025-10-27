import React, { useEffect, useState } from 'react';
import { Alert, Paper, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData } from 'primereact/datatable';
import { Column, ColumnEditorOptions, ColumnEvent } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { EditOutlined } from '@mui/icons-material';
import { MetaDataColumn } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import { getFieldsV2, patchFieldV2 } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import LoadingState from '../../constants/loadingState';
import { hasPermissionV2 } from '../../permissions/accessTable';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { NumericEditable, TextEditable } from './EditableFields';
import { ScopeDefinitions } from '../../constants/scopes';
import { selectTenantState, TenantSliceState } from '../../app/tenantSlice';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import AllowedValues from './AllowedValues';
import { FieldType, FIELD_TYPE_COLOURS } from '../../styles/fieldTypeColours';

function Fields() {
  const bodyValueWithEditIcon = (rowData: any, field: string) => (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
      {rowData[field] === null || rowData[field] === '' ? <div /> : rowData[field]}
      <EditOutlined color="disabled" fontSize="small" sx={{ marginLeft: '10px', marginRight: '10px' }} />
    </div>
  );

  const renderFieldType = (rowData: any, field: string) => {
    const type: string = rowData[field];
    const colour = FIELD_TYPE_COLOURS[type as FieldType] ?? FIELD_TYPE_COLOURS.default;
    
    return (
      <Chip
        size="small"
        sx={{
          color: 'white',
          backgroundColor: colour,
          fontWeight: 'bold',
        }}
        label={type}
      />
    );
  };
  
  const renderAllowedValues = (allowedValues: string[] | null, field:string) => {
    if (allowedValues === null || allowedValues.length === 0) return '';
    return (
      <AllowedValues allowedValues={allowedValues} field={field} />
    );
  };
  
  const interactiveColumns = [
    {
      field: 'columnName',
      header: 'Field',
      hidden: false,
    },
    {
      field: 'primitiveType',
      header: 'Type',
      body: (rowData: any) => renderFieldType(rowData, 'primitiveType'),
      hidden: false,
    },
    {
      field: 'description',
      header: 'Description',
      body: (rowData: any) => bodyValueWithEditIcon(rowData, 'description'),
      editable: true,
      hidden: false,
    },
    {
      field: 'examples',
      header: 'Examples',
      body: (rowData: any) => bodyValueWithEditIcon(rowData, 'examples'),
      editable: true,
      hidden: false,
    },
    {
      field: 'metaDataColumnValidValues',
      header: 'Allowed Values',
      body: (rowData: any) => renderAllowedValues(
        rowData.metaDataColumnValidValues,
        rowData.columnName,
      ),
      hidden: false,
    },
    {
      field: 'columnOrder',
      header: 'Ordering',
      body: (rowData: any) => bodyValueWithEditIcon(rowData, 'columnOrder'),
      editable: true,
      hidden: false,
    },
  ];

  const nonInteractiveColumns = [
    {
      field: 'columnName',
      header: 'Field',
      hidden: false,
    },
    {
      field: 'primitiveType',
      header: 'Type',
      hidden: false,
    },
    {
      field: 'description',
      header: 'Description',
      hidden: false,
    },
    {
      field: 'examples',
      header: 'Examples',
      hidden: false,
    },
    {
      field: 'metaDataColumnValidValues',
      header: 'Allowed Values',
      body: (rowData: any) => renderAllowedValues(
        rowData.metaDataColumnValidValues,
        rowData.columnName,
      ),
      hidden: false,
    },
  ];
  // The scope should be in scope constant file somewhere in the future.
  // So it can be synced with the backend.
  const scope = ScopeDefinitions.UPDATE_TENANT_METADATA_COLUMN;

  const user: UserSliceState = useAppSelector(selectUserState);
  const tenant: TenantSliceState = useAppSelector(selectTenantState);
  const interactionPermission = hasPermissionV2(
    user,
    tenant.defaultTenantGlobalId,
    tenant.defaultTenantName,
    scope,
  );
  
  const [fields, setFields] = useState<MetaDataColumn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>(
    interactionPermission ?
      interactiveColumns :
      nonInteractiveColumns,
  );
  const { token, tokenLoading } = useApi();
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

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
        const response: ResponseObject = await getFieldsV2(tenant.defaultTenantGlobalId, token);
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
  }, [token, tokenLoading, tenant.defaultTenantGlobalId]);

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
        <ColumnVisibilityMenu
          columns={columns}
          onColumnVisibilityChange={(selectedColumns: any[]) => {
            const newColumns = columns.map((col: any) => {
              const newCol = { ...col };
              newCol.hidden = selectedColumns.some((sCols: any) => sCols.field === col.field);
              return newCol;
            });
            setColumns(newColumns);
          }}
        />
      </div>
    </div>
  );

  const cellEditor = (options: ColumnEditorOptions) => {
    if (options.field === 'columnOrder') {
      return <NumericEditable value={options.value} editorCallback={options.editorCallback!} />;
    }
    if (options.field === 'description' || options.field === 'examples') {
      return <TextEditable value={options.value} editorCallback={options.editorCallback!} />;
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

    const response = await patchFieldV2(tenant.defaultTenantGlobalId, fieldName, token, fieldData);
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
          editMode={interactionPermission ? 'cell' : undefined}
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
                hidden={col.hidden}
                headerClassName="custom-title"
                style={{ whiteSpace: 'normal', maxWidth: '15rem' }}
                bodyStyle={{ verticalAlign: 'top' }}
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
