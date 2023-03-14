import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';
import MaterialReactTable, { MRT_PaginationState, MRT_SortingState, MRT_ColumnDef } from 'material-react-table';
import { getSamples } from '../../utilities/resourceUtils';
import styles from './ProjectOverview.module.css'
import { ProjectSample } from '../../types/sample.interface';

// TODO: move sample list state to parent component (headers and data)

interface SamplesProps {
  sampleList: ProjectSample[],
  totalSamples: number,
  setProjectSamples: Dispatch<SetStateAction<ProjectSample[]>>,
  isSamplesLoading: boolean
}

const Samples = (props: SamplesProps) =>  {
  const { sampleList, totalSamples, setProjectSamples } = props;
  const [ isLoading, setIsLoading ] = useState(true)
  const [ isError, setIsError ] = useState(false)
  const [samples, setSamples] = useState<ProjectSample[]>([])
  const [columns, setColumns] = useState<MRT_ColumnDef[]>([])

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50, 
  });
  
  useEffect(() => {
    //TODO: Integrate endpoint to get columns/column visibility: { fieldOne: false, fieldTwo: false }
    getHeaders()
  },[])

  useEffect(() => {
    // Only get samples when columns are already populated
    if(columns.length > 0) {
      setIsLoading(true)
      getProjectSamples()   
    }   
  }, [pagination.pageIndex, pagination.pageSize, columns]);

  async function getHeaders() {
    // Using a intermediate endpoint for the time being until a "get columns" endpoint is defined
    await getSamples(`groupContext=${sessionStorage.getItem("selectedProjectMemberGroupId")}`)
      .then((response) => {
        return response.json()
      })
      .then((response_data) => {
        if(response_data.length > 1) {
          const columnHeaderArray = Object.keys(response_data[0])
          const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> | { accessorKey: string; header: string; }[]=[]
          columnHeaderArray.forEach(element => {
            columnBuilder.push({ accessorKey: element, header: element, })
          }); 
          setColumns(columnBuilder)
        } else {
          setIsLoading(false)
        }
      })
      .catch(error => console.log(error))
  }

  async function getProjectSamples() {
    const searchParams = new URLSearchParams({
      "Page" : (pagination.pageIndex+1).toString(),
      "PageSize" : (pagination.pageSize).toString(),
      "groupContext" : `${sessionStorage.getItem("selectedProjectMemberGroupId")}`
    })

    await getSamples(searchParams.toString())
      .then((response) => {
        return response.json()
      })
      .then((response_data) => {
        console.log(response_data)
        setSamples(response_data)
        setIsLoading(false)
      })
      .catch(error => {
        console.log(error)
        setIsLoading(false)
        setIsError(true)
      })
  }

  return (
    <>
     <p className={styles.h1}>Samples</p><br />
      <MaterialReactTable 
        columns={columns}
        data={samples}
        enableStickyHeader
        manualPagination
        manualFiltering
        columnResizeMode="onChange"
        muiToolbarAlertBannerProps={
          isError
            ? {
                color: 'error',
                children: 'Error loading data',
              }
            : undefined
        }
        muiTableBodyProps={{
          sx: {
            //stripe the rows, make odd rows a darker color
            '& tr:nth-of-type(odd)': {
              backgroundColor: '#f5f5f5',
            },
          },
        }}
        muiLinearProgressProps={({ isTopToolbar }) => ({
          sx: { display: isTopToolbar ? 'block' : 'none' },
        })}
        muiTableContainerProps={{ sx: { maxHeight: '75vh'} }}
        muiTablePaginationProps={{
          rowsPerPageOptions: [10, 25, 50, 100, 500, 1000, 2000, 3000],
        }}
        onPaginationChange={setPagination}
        state={{ 
          pagination,
          sorting,
          isLoading,
          showAlertBanner: isError, 
        }}
        initialState={{ density: 'compact'}}
        rowCount={totalSamples}
        // Layout props
        muiTableProps={{sx: {width: "auto", tableLayout: "auto", }}}
        // Column manipulation
        enableColumnResizing
        enableColumnDragging
        enableColumnOrdering
        // Improving performance
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        //memoMode="cells"
        enableRowVirtualization
      />
    </>
  )
}
export default Samples;