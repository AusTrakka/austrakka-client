import React from 'react';
import { Alert, AlertTitle, Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import { useAppSelector } from '../../../app/store';
import DrilldownButton from '../../Common/DrilldownButton';
import { formatDateAsTwoStrings } from '../../../utilities/dateUtils';
import { maxObj } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import { useStableNavigate } from '../../../app/NavigationContext';

function SampleSummary(props: ProjectWidgetProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const { navigate } = useStableNavigate();
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
    if (timeFilterObject && Object.keys(timeFilterObject).length !== 0) {
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
  
  const renderLatestSampleUpload = () => {
    // If there are no samples
    // Should only be called if state DATA_LOADED, but check metadata exists anyway
    if (!data?.metadata || data.metadata.length === 0) {
      return (
        <Tooltip title="No records in project" placement="top">
          <Typography variant="h2" paddingBottom={1} color="primary">
            None
          </Typography>
        </Tooltip>
      );
    }
    
    // If there are samples but we don't know Date_created
    if (!(data!.fields!.some((field) => field.columnName === 'Date_created'))) {
      return (
        <Tooltip
          title="Date_created is not a project field, so latest uploaded sample is not known"
          placement="top"
        >
          <Typography variant="h2" paddingBottom={1} color="primary">
            Unknown
          </Typography>
        </Tooltip>
      );
    }
    
    // Success case
    return (
      <>
        <Typography variant="h2" paddingBottom={1} color="primary">
          {formatDateAsTwoStrings(maxObj(data!.metadata!.map((sample) => sample.Date_created)))[0]}
        </Typography>
        <Stack direction="row" spacing={5}>
          <Typography variant="subtitle2" paddingBottom={1} color="primary">
            {formatDateAsTwoStrings(
              maxObj(data!.metadata!.map((sample) => sample.Date_created)),
            )[1]}
          </Typography>
          <DrilldownButton
            title="View Samples"
            enabled={data!.metadata!.length > 0}
            onClick={() => handleDrilldownFilters(
              'latest_upload',
              getLastUploadFilter(
                maxObj(data!.metadata!.map((sample) => sample.Date_created)),
              ),
            )}
          />
        </Stack>
      </>
    );
  };
  
  return (
    <Box>
      <Grid container spacing={2} direction="row" justifyContent="space-between">
        { data?.loadingState === MetadataLoadingState.DATA_LOADED && (
          <>
            <Grid item>
              <Typography variant="h5" paddingBottom={1} color="primary">
                Total samples
              </Typography>
              <Typography variant="h2" paddingBottom={1} color="primary.main">
                {filteredData!.length.toLocaleString('en-US') + (
                  (timeFilterObject && Object.keys(timeFilterObject).length > 0) ? ` (${data!.metadata!.length.toLocaleString('en-US')})` : '')}
              </Typography>
              <DrilldownButton
                title="View Samples"
                onClick={() => handleDrilldownFilters('all_samples', allSamplesFilter)}
              />
            </Grid>
            <Grid item>
              <Typography variant="h5" paddingBottom={1} color="primary">
                Latest sample upload
              </Typography>
              {renderLatestSampleUpload()}
            </Grid>
            <Grid item>
              <Typography variant="h5" paddingBottom={1} color="primary">
                Records without sequences
              </Typography>
              {(data!.fields!.some((field) => field.columnName === 'Has_sequences') ? (
                <>
                  <Typography variant="h2" paddingBottom={1} color="primary">
                    {(filteredData!.filter((sample) => !sample.Has_sequences).length).toLocaleString('en-US') + (
                      (timeFilterObject && Object.keys(timeFilterObject).length > 0) ?
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
              ))}
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
export default SampleSummary;
