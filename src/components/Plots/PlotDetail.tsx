import { useEffect, useState } from "react";
import { Plot } from "../../types/dtos"
import { useParams } from "react-router-dom";
import { Typography } from "@mui/material";

const PlotDetail = () => {

  const {projectAbbrev, plotAbbrev} = useParams();
  const [plot, setPlot] = useState<Plot | null>()

  return(<>Placeholder for plot {plotAbbrev}</>)
}

export default PlotDetail;