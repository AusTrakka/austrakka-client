import { useEffect, useState } from "react";
import { Plot } from "../../types/dtos"
import { useParams } from "react-router-dom";
import { Typography } from "@mui/material";
import ClusterTimeline from "./PlotTypes/ClusterTimeline";
import { ResponseObject, getPlotDetails, getProjectDetails } from "../../utilities/resourceUtils";

const PlotDetail = () => {

  const {projectAbbrev, plotAbbrev} = useParams();
  const [plot, setPlot] = useState<Plot | null>()
  const [projectId, setProjectId] = useState<number | null>()

  useEffect(() => {
    // Get plot details, including plot type
    const getPlot = async () => {
      const plotResponse: ResponseObject = await getPlotDetails(plotAbbrev!)
      if (plotResponse.status === "Success"){
        setPlot(plotResponse.data as Plot)
      } else {
        // TODO display error banner if we failed to load the plot
      }
    }
    // Get projectId for purposes of plot metadata retrieval
    const getProjectId = async () => {
      const plotResponse: ResponseObject = await getProjectDetails(projectAbbrev!)
      if (plotResponse.status === "Success"){
        setProjectId(plotResponse.data.projectId)
      } else {
        // TODO display error banner if we failed to load the project details
      }
    }

    getPlot();
    getProjectId();
  } ,[plotAbbrev, projectAbbrev])

  // TODO display error banner if plot type is unrecognised 
  const renderPlot = () => {
    if(!plot || !projectId){
      return <Typography>Loading plot</Typography>
    }
    switch (plot.plotType){
      case "ClusterTimeline":
        return <ClusterTimeline plot={plot} projectId={projectId}/>
      default:
        return <Typography>Plot type {plot.plotType} cannot be rendered</Typography>
    }
  }
  
  return(renderPlot())
}

export default PlotDetail;