import React, { useEffect, useState } from 'react';
import { Alert, Paper, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { MetaDataColumn } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import { getFields } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import LoadingState from '../../constants/loadingState';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

function Fields() {
  const [fields, setFields] = useState<MetaDataColumn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });
  const user: UserSliceState = useAppSelector(selectUserState);

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
      const response: ResponseObject = await getFields(token);
      if (response.status === ResponseType.Success) {
        const responseFields: MetaDataColumn[] = response.data;
        responseFields.sort((a, b) => a.columnOrder - b.columnOrder);
        setNullsToCategorical(responseFields);
        setFields(responseFields);
      } else if (response.status === ResponseType.Error) {
        setError(response.message);
      }
    };
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      retrieveFields();
    }
  }, [token, tokenLoading]);

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

  const columns = [
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
      field: 'columnOrder',
      header: 'Ordering',
    },
    {
      field: 'metaDataColumnValidValues',
      header: 'Allowed Values',
      body: (rowData: any) => renderAllowedValues(rowData.metaDataColumnValidValues),
    },
  ];

  return (
    !hasPermission(user, 'AusTrakka-Owner', 'users', PermissionLevel.CanShow) ? (
      <Alert severity="error">
        Admin Only Page: Unauthorized
      </Alert>
    ) : (
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
            rowsPerPageOptions={[25, 50, 100, 150]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
            currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
            paginatorPosition="bottom"
            paginatorRight
            selectionMode="single"
            editMode="cell"
            filters={globalFilter}
          >
            {columns.map((col: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={col.body}
                editor={col.editor}
                sortable
                resizeable
                headerClassName="custom-title"
              />
            ))}
          </DataTable>
        </Paper>
      </>
    )
  );
}

export default Fields;
