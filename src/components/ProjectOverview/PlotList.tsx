import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import isoDateLocalDate from '../../utilities/helperUtils';
import { PlotListing, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { getPlots } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';

interface PlotListProps {
  projectDetails: Project | null
  isPlotsLoading: boolean
  setIsPlotsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const plotTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'created', header: 'Created', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell.getValue())}</> },
];

function PlotList(props: PlotListProps) {
  const { projectDetails, isPlotsLoading, setIsPlotsLoading } = props;

  const [plotList, setPlotList] = useState<PlotListing[]>([]);
  const navigate = useNavigate();
  const { token } = useApi();

  useEffect(() => {
    async function getPlotList() {
      const plotsResponse: ResponseObject = await getPlots(projectDetails!.projectId, token);
      if (plotsResponse.status === ResponseType.Success) {
        setPlotList(plotsResponse.data as PlotListing[]);
        setIsPlotsLoading(false);
      } else {
        setIsPlotsLoading(false);
        setPlotList([]);
        // TODO set plots errors
      }
    }

    if (projectDetails) {
      getPlotList();
    }
  }, [projectDetails, setIsPlotsLoading, token]);

  const rowClickHandler = (row: any) => {
    navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.original.abbreviation}`);
  };

  if (isPlotsLoading) return null;

  return (
    <MaterialReactTable
      columns={plotTableColumns}
      data={plotList}
      state={{
        isLoading: isPlotsLoading,
      }}
      enableStickyHeader
      initialState={{ density: 'compact' }}
      enableColumnResizing
      enableFullScreenToggle={false}
      enableHiding={false}
      enableDensityToggle={false}
      muiLinearProgressProps={({ isTopToolbar }) => ({
        color: 'secondary',
        sx: { display: isTopToolbar ? 'block' : 'none' },
      })}
        // Layout props
      muiTableProps={{
        sx: {
          'width': 'auto', 'tableLayout': 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
        },
      }}
        // Row click handler
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => rowClickHandler(row),
        sx: {
          cursor: 'pointer',
        },
      })}
    />
  );
}
export default memo(PlotList);
