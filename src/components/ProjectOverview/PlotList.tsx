
import React, {createRef, useEffect, useState, memo} from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialReactTable, { MRT_PaginationState, MRT_SortingState, MRT_ColumnDef } from 'material-react-table';
import styles from './ProjectOverview.module.css'
import { SyncProblemSharp } from '@mui/icons-material';

interface PlotListProps {
  isPlotsLoading: boolean
  plotList: object[]
  projectAbbrev: string
}

const plotTableColumns: MRT_ColumnDef[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "created", header: "Created" },
];

function PlotList(props: PlotListProps) {

  let { isPlotsLoading, plotList, projectAbbrev } = props;
  
  const navigate = useNavigate()

  const rowClickHandler = (row: any) => {
    navigate(`/projects/${projectAbbrev}/plots/${row.original.abbreviation}`)
  };

  return (
    <>
        <p className={styles.h1}>Plots</p>
        <MaterialReactTable
          columns = {plotTableColumns}
          data = {plotList} 
          state = {{
            isLoading: isPlotsLoading
          }}
          enableStickyHeader
        initialState={{ density: 'compact'}}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableHiding={false}
        enableDensityToggle={false}
        muiLinearProgressProps={({ isTopToolbar }) => ({
          color: 'secondary',
          sx: { display: isTopToolbar ? 'block' : 'none' },
        })}
        // Layout props
        muiTableProps={{sx: {width: "auto", tableLayout: "auto", '& td:last-child': {width: '100%'}, '& th:last-child': {width: '100%'}}}}
        //Row click handler
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row)
        })}
          />
    </>
  )
}
export default memo(PlotList);
