import { useEffect, useState } from "react";
import { Plot } from "../../types/dtos"
import { useParams } from "react-router-dom";
import { Alert, Typography } from "@mui/material";
import ClusterTimeline from "./PlotTypes/ClusterTimeline";
import { ResponseObject, getPlotDetails, getProjectDetails } from "../../utilities/resourceUtils";

const PlotDetail = () => {

  // Note that if the project abbrev is wrong in the URL, there will be no effect
  // We use the plot abbrev to get the correct project
  const {projectAbbrev, plotAbbrev} = useParams();
  const [plot, setPlot] = useState<Plot | null>()

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

    getPlot();
  }, [plotAbbrev])

  // TODO display error banner if plot type is unrecognised 
  const renderPlot = () => {
    if(!plot){
      return <Typography>Loading plot</Typography>
    }
    switch (plot.plotType){
      case "ClusterTimeline":
        return <ClusterTimeline plot={plot}/>
      default:
        return <Typography>Plot type {plot.plotType} cannot be rendered</Typography>
    }
  }
  
  return(
    <>
      <Typography className="pageTitle">
        {plot ? plot.name : ""}    
      </Typography>
      {renderPlot()}
    </>
    )
}

export default PlotDetail;