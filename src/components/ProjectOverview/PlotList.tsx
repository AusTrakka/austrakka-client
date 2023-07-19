import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import isoDateLocalDate from '../../utilities/helperUtils';
interface PlotListProps {
  isPlotsLoading: boolean
  plotList: object[]
  projectAbbrev: string
}

const plotTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'created', header: 'Created', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell)}</>  },
];

function PlotList(props: PlotListProps) {
  const { isPlotsLoading, plotList, projectAbbrev } = props;

  const navigate = useNavigate();

  const rowClickHandler = (row: any) => {
    navigate(`/projects/${projectAbbrev}/plots/${row.original.abbreviation}`);
  };

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
          width: 'auto', tableLayout: 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
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
