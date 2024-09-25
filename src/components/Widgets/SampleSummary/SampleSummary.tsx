import React from 'react';
import { Alert, AlertTitle, Box, Grid, Tooltip, Typography } from '@mui/material';
import { Event, FileUploadOutlined, RuleOutlined } from '@mui/icons-material';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store';
import DrilldownButton from '../../Common/DrilldownButton';
import { formatDate } from '../../../utilities/dateUtils';
import { maxObj } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';

export default function SampleSummary(props: any) {
  const {
    projectAbbrev, filteredData, timeFilterObject,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const navigate = useNavigate();

  // Drilldown filters
  const allSamplesFilter: any [] = [];

  const hasSequenceFilter: DataTableFilterMeta = {
    Has_sequences: {
      operator: FilterOperator.AND,
      constraints: [
        {
          matchMode: FilterMatchMode.EQUALS,
          value: false,
        },
      ],
    },
  };
  const getLastUploadFilter = (date: any) => {
    const latestUploadFilter: DataTableFilterMeta = {
      Date_created: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.DATE_IS,
            value: date,
          },
        ],
      },
    };
    return latestUploadFilter;
  };

  const handleDrilldownFilters = (drilldownName: string, drilldownFilters: any) => {
    // Append timeFilterObject for last_week and last_month filters
    if (Object.keys(timeFilterObject).length !== 0) {
      // AppendtimeFilterObject for drills down other than latest_upload
      if (drilldownName === 'all_samples' || drilldownName === 'has_sequence') {
        const appendedFilters: DataTableFilterMeta = {
          ...drilldownFilters,
          ...timeFilterObject,
        };
        updateTabUrlWithSearch(navigate, '/samples', appendedFilters);
      } else {
        updateTabUrlWithSearch(navigate, '/samples', drilldownFilters);
      }
    } else {
      updateTabUrlWithSearch(navigate, '/samples', drilldownFilters);
    }
  };

  return (
    <Box>
      <Grid container spacing={6} direction="row" justifyContent="space-between">
        { data?.loadingState === MetadataLoadingState.DATA_LOADED && (
        <>
          <Grid item>
            <FileUploadOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Total samples
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              { filteredData!.length.toLocaleString('en-US') + (
                (Object.keys(timeFilterObject).length > 0) ? ` (${data!.metadata!.length.toLocaleString('en-US')})` : '')}
            </Typography>
            <DrilldownButton
              title="View Samples"
              onClick={() => handleDrilldownFilters('all_samples', allSamplesFilter)}
            />
          </Grid>
          <Grid item>
            <Event color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Latest sample upload
            </Typography>
            { (data!.fields!.some((field) => field.columnName === 'Date_created') ? (
              <>
                <Typography variant="h2" paddingBottom={1} color="primary">
                  { formatDate(maxObj(data!.metadata!.map((sample) => sample.Date_created))) }
                </Typography>
                <DrilldownButton
                  title="View Samples"
                  onClick={() => handleDrilldownFilters(
                    'lastest_upload',
                    getLastUploadFilter(
                      maxObj(data!.metadata!.map((sample) => sample.Date_created)),
                    ),
                  )}
                />
              </>
            ) : (
              <Tooltip title="Date_created is not a project field, so latest uploaded sample is not known" placement="top">
                <Typography variant="h2" paddingBottom={1} color="primary">
                  Unknown
                </Typography>
              </Tooltip>
            )) }
          </Grid>
          <Grid item>
            <RuleOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Records without sequences
            </Typography>
            { (data!.fields!.some((field) => field.columnName === 'Has_sequences') ? (
              <>
                <Typography variant="h2" paddingBottom={1} color="primary">
                  { (filteredData!.filter((sample) => !sample.Has_sequences).length).toLocaleString('en-US') + (
                    (Object.keys(timeFilterObject).length > 0) ?
                      ` (${(data!.metadata!.filter((sample) => !sample.Has_sequences).length).toLocaleString('en-US')})` : ''
                  )}
                </Typography>
                <DrilldownButton
                  title="View Samples"
                  onClick={() => handleDrilldownFilters('has_sequence', hasSequenceFilter)}
                />
              </>
            ) : (
              <Tooltip title="Has_sequences is not a project field, so this count is not known" placement="top">
                <Typography variant="h2" paddingBottom={1} color="primary">
                  Unknown
                </Typography>
              </Tooltip>
            )) }
          </Grid>
        </>
        )}
        { data?.errorMessage && (
        <Grid container item>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {data!.errorMessage}
          </Alert>
        </Grid>
        )}
        { (!data?.loadingState ||
          !(data.loadingState === MetadataLoadingState.DATA_LOADED ||
            data.loadingState === MetadataLoadingState.ERROR ||
            data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR)) && (
            <Grid container item>
              Loading...
            </Grid>
        )}
      </Grid>
    </Box>
  );
}
