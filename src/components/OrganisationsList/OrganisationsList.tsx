import HomeIcon from '@mui/icons-material/Home';
import { Alert, Paper, Stack, Typography } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { useAppSelector } from '../../app/store';
import { selectUserState, type UserSliceState } from '../../app/userSlice';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Organisation } from '../../types/dtos';
import { getOrganisations } from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import styles from './OrganisationsList.module.css';

function OrganisationsList() {
  const [homeOrg, setHomeOrg] = useState<Organisation[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();
  const user: UserSliceState = useAppSelector(selectUserState);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const columns = [
    {
      field: 'abbreviation',
      header: 'Abbreviation',
      body: (rowData: Organisation) => {
        if (rowData.abbreviation === user.orgAbbrev) {
          return (
            <div style={{ display: 'flex' }}>
              <HomeIcon
                sx={{
                  color: Theme.SecondaryLightGreen,
                  fontSize: 20,
                }}
              />
              <span>{rowData.abbreviation}</span>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>{rowData.abbreviation}</span>
          </div>
        );
      },
    },
    { field: 'name', header: 'Name' },
    { field: 'country', header: 'Country' },
    { field: 'state', header: 'State' },
  ];

  useEffect(() => {
    const isTokenReady =
      tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING;

    if (!isTokenReady) return;

    const fetchOrganisations = async () => {
      const orgRes = await getOrganisations(true, token);

      if (orgRes.status !== ResponseType.Success) {
        setIsError(true);
        setIsLoading(false);
        setOrganisations([]);
        setErrorMessage(orgRes.message);
        return;
      }

      const organisations = orgRes.data;

      if (organisations === undefined || organisations.length === 0) {
        setOrganisations([]);
      } else {
        setOrganisations(organisations);
      }
      setIsLoading(false);
      setIsError(false);
    };

    fetchOrganisations().catch((err) => {
      setIsError(true);
      setErrorMessage(err.message);
    });
  }, [token, tokenLoading]);

  useEffect(() => {
    if (selectedOrg !== undefined && selectedOrg !== null) {
      navigate(`/organisations/${selectedOrg}`);
    }
  }, [selectedOrg, navigate]);

  useEffect(() => {
    if (organisations.length === 0) {
      return;
    }
    const home = organisations.find((x) => x.abbreviation === user.orgAbbrev)!;
    if (organisations.length === 1) {
      setSelectedOrg(home?.abbreviation);
    }
    setHomeOrg([home]);
    setFilteredOrgs(organisations.filter((x) => x.organisationId !== home.organisationId));
  }, [organisations, user]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filtersCopy = { ...filters };
    (filtersCopy.global as DataTableFilterMetaData).value = value;
    setFilters(filtersCopy);
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    setSelectedOrg(row.data.abbreviation);
  };

  const header = (
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <SearchInput
          value={(filters.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
      </Stack>
    </div>
  );

  return isError ? (
    <Alert severity="error">{errorMessage}</Alert>
  ) : (
    <div hidden={isLoading || organisations.length === 1}>
      <Typography className="pageTitle">Organisations</Typography>
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          frozenValue={homeOrg}
          value={filteredOrgs}
          className="my-flexible-table"
          resizableColumns
          reorderableColumns
          sortIcon={sortIcon}
          sortField="abbreviation"
          sortOrder={1}
          filters={filters}
          globalFilterFields={columns.map((col) => col.field)}
          size="small"
          removableSort
          scrollable
          rows={25}
          rowClassName={(rowData) =>
            rowData.abbreviation === user.orgAbbrev ? styles['home-row'] : ''
          }
          scrollHeight="calc(100vh - 300px)"
          onRowClick={rowClickHandler}
          selectionMode="single"
          showGridlines
          header={header}
          loading={isLoading}
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              className="flexible-column"
              headerClassName="custom-title"
              bodyClassName="value-cells"
            />
          ))}
        </DataTable>
      </Paper>
    </div>
  );
}

export default OrganisationsList;
