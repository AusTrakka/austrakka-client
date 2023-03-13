import { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { getProjectList } from '../../utilities/resourceUtils';


const ProjectsList = () => {
  const [projectsList, setProjectsList] = useState([])
  const [loading, setLoading] = useState()
  const [selectedProject, setSelectedProject] = useState({})
  const [includeAll, setIncludeAll] = useState(false)
  const navigate = useNavigate()

  const columns:MRT_ColumnDef[] = [
    { header: "Abbreviation", accessorKey: "abbreviation"},
    { header: "Name", accessorKey: "name"},
    { header: "Description", accessorKey: "description"},
    { header: "Created", accessorKey: "created", Cell: ({ cell }) => { return <div>{isoDateLocalDate(cell)}</div>}}
  ];
  
  useEffect(() => {
    getProjectList()
    .then((response) => response.json())
    .then((response_data) => {
      setProjectsList(response_data);
    })
    .catch(error => {
      console.error('There was an error retrieving project data!', error);
    });
  }, [])

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { projectMembers, name, projectId }: any = selectedProject
      sessionStorage.setItem('selectedProjectMemberGroupId', projectMembers.id)
      sessionStorage.setItem('selectedProjectName', name)
      sessionStorage.setItem('selectedProjectId', projectId)
      navigate("/projects/details")
    }
  }, [selectedProject])

  const rowClickHandler = (row: any) => {
    let selectedProject = row.original
    setSelectedProject(selectedProject)
  };
  
  return (
    <>
      <MaterialReactTable 
        columns={columns}
        data={projectsList}
        enableStickyHeader
        initialState={{ density: 'compact'}}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableHiding={false}
        enableDensityToggle={false}
        // Layout props
        muiTableProps={{sx: {width: "auto", tableLayout: "auto",/*  '& td:last-child': {width: '100%'} */}}}
        //Row click handler
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row)
        })}
      />
    </>
  )
}
export default ProjectsList;