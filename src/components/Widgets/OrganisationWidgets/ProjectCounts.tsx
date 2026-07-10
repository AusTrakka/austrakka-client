import { Alert, AlertTitle, Box, CircularProgress, Typography } from '@mui/material';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { useEffect, useMemo, useState } from 'react';
import { useStableNavigate } from '../../../app/NavigationContext';
import { selectOrgMetadata } from '../../../app/orgMetadataSlice';
import { type RootState, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../constants/metadataLoadingState';
import type RecordTypes from '../../../constants/record-type.enum';
import type { Sample } from '../../../types/sample.interface';
import { WidgetType } from '../../../types/widget.props';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

// Displays a table of counts of samples by each project (Shared_groups)
// Requires Shared_groups field to be present in the metadata
// Also counts how many of the samples in each project are shared with other projects

const SHARED_GROUPS_FIELD = 'Shared_groups';
const UNSHARED_COLUMN = 'Unshared';

type ProjectSharingCount = {
  project: string;
  total: number;
  sharedWithOthers: number;
};

interface ProjectCountsProps {
  widgetType: WidgetType;
  recordType: RecordTypes;
  identifier: string;
  title?: string | undefined;
}

function calculateSharedGroups(data: Sample[]): ProjectSharingCount[] {
  const groupMembers: { [key: string]: Set<string> } = {};
  let unsharedCount = 0;

  data.forEach((sample) => {
    if (!sample[SHARED_GROUPS_FIELD]) {
      unsharedCount++;
      return;
    }
    const groups = JSON.parse(sample[SHARED_GROUPS_FIELD]);
    groups
      .filter((group: string) => group.endsWith('-Group'))
      .forEach((group: string) => {
        const name = group.slice(0, -'-Group'.length);
        if (!groupMembers[name]) groupMembers[name] = new Set();
        groupMembers[name].add(sample.Seq_ID);
      });
  });

  const projectNames = Object.keys(groupMembers);

  const results = projectNames.map((project) => {
    const members = groupMembers[project];
    let sharedCount = 0;

    members.forEach((member) => {
      const inOtherGroup = projectNames.some(
        (og) => og !== project && groupMembers[og].has(member),
      );
      if (inOtherGroup) sharedCount++;
    });

    return {
      project: project,
      total: members.size,
      sharedWithOthers: sharedCount,
    };
  });

  const sorted = results.sort((a, b) => a.project.localeCompare(b.project));

  if (unsharedCount > 0) {
    sorted.push({
      project: UNSHARED_COLUMN,
      total: unsharedCount,
      sharedWithOthers: 0,
    });
  }

  return sorted;
}

export default function ProjectCounts(props: ProjectCountsProps) {
  const { identifier, title, widgetType } = props;
  const [projectCounts, setProjectCounts] = useState<ProjectSharingCount[]>([]);
  const { navigate } = useStableNavigate();

  const metadataSelector = useMemo(
    () => (state: RootState) => {
      switch (widgetType) {
        case WidgetType.Organisation:
          return selectOrgMetadata(state, identifier);
        default:
          throw new Error(`This widget is not supported for widget type: ${widgetType}`);
      }
    },
    [identifier, widgetType],
  );

  const data = useAppSelector(metadataSelector);
  const loaded = hasCompleteData(data?.loadingState);

  const errorMessage = useMemo(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR)
      return data.errorMessage ?? 'Unknown error';
    if (data?.fields && data.fields.length > 0) {
      const fieldNames = data.fields.map((f) => f.columnName);
      if (!fieldNames.includes(SHARED_GROUPS_FIELD))
        return `Field ${SHARED_GROUPS_FIELD} not found in ${widgetType}`;
    }
    return null;
  }, [data, widgetType]);

  const handleClick = (project: string) => {
    const unsharedFlag = project === UNSHARED_COLUMN;

    const filters: DataTableFilterMeta = {
      [SHARED_GROUPS_FIELD]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: unsharedFlag ? FilterMatchMode.CUSTOM : FilterMatchMode.CONTAINS,
            value: unsharedFlag ? 'true' : project,
          },
        ],
      },
    };
    updateTabUrlWithSearch(navigate, '/samples', filters);
  };

  // Calculate project sharing counts
  useEffect(() => {
    if (!data?.fields) return;
    if (data.loadingState === MetadataLoadingState.DATA_LOADED) {
      const counts = calculateSharedGroups(data.metadata as Sample[]);
      setProjectCounts(counts);
    }
  }, [data?.metadata, data?.fields, data?.loadingState]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {title !== '' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant="h5"
            paddingBottom={3}
            color="primary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {title ?? `Project contributions`}
          </Typography>
        </Box>
      )}

      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {!loaded && !errorMessage && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          flex={1}
          minHeight={0}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      {loaded && !errorMessage && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataTable
            value={projectCounts}
            emptyMessage="No data available"
            size="small"
            className="my-flexible-table"
            scrollable
            scrollHeight="flex"
          >
            <Column
              field="project"
              header="Project"
              className="flexible-column"
              bodyClassName="value-cells"
              frozen
              style={{ minWidth: '150px' }}
              body={(rowData) => (
                <Box
                  component="span"
                  onClick={() => handleClick(rowData.project)}
                  sx={{
                    cursor: 'pointer',
                    display: 'inline-block',
                    px: 1,
                    py: 0.5,
                    borderRadius: 16,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    '&:hover': {
                      backgroundColor: Theme.SecondaryMain50,
                    },
                  }}
                >
                  {rowData.project}
                </Box>
              )}
            />
            <Column
              field="total"
              className="flexible-column"
              bodyClassName="value-cells"
              header="Sample Count"
            />
          </DataTable>
        </Box>
      )}
    </Box>
  );
}
