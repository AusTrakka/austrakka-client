
import { useState, useEffect } from "react"
import { Vega, VegaLite, VisualizationSpec, SignalListener } from 'react-vega';
import { Config, TopLevelSpec, compile } from 'vega-lite';
import { Plot } from "../../../types/dtos";
import { ResponseObject, getPlotData } from "../../../utilities/resourceUtils";

const SAMPLE_ID_FIELD = "SampleName"

// Assumed fields here are Date_coll, Seq_ID(SAMPLE_ID_FIELD)
const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'Categorical faceted timeline diagram with jitter - e.g. cluster timeline',
  data: {name: 'inputdata'},   // for Vega-Lite an object, for Vega a list of objects
  transform: [
    {
      calculate: "0.8*sqrt(-2*log(random()))*cos(2*PI*random())",
      as: "jitter"
    }
  ],
  width: 900,
  height: 900,
  mark: 'point',
  encoding: {
    x: {field: 'Date_coll', type: 'temporal'},
    y: {field: 'cgMLST', type: 'nominal'},
    yOffset: {field: 'jitter', type: 'quantitative'},
    color: {
      field: 'cgMLST'
    },
    tooltip: {field: SAMPLE_ID_FIELD, type: 'nominal'}
  }
};

// This should probably be for all plottypes, so move out
interface SpecificPlotProps {
  plot: Plot | undefined | null,
}

const ClusterTimeline = (props: SpecificPlotProps) => {
  let { plot } = props
  const [spec, setSpec] = useState<TopLevelSpec | null>(null)
  const [data, setData] = useState([])

  // Set spec on load
  useEffect(() => {
    if (plot?.spec && plot?.spec.length > 0){
      // May need to adjust e.g. width and height in spec
      setSpec(JSON.parse(plot.spec) as TopLevelSpec)
    } else {
      setSpec(defaultSpec)
    }
  }, [plot])

  // Get data on load
  useEffect(() => {
    const updatePlotData = async (fields: string[]) => {
      const response = await getPlotData(plot!.projectGroupId, fields) as ResponseObject
      getPlotData(plot!.projectId, fields)
      if(response.status == 'Success'){
        setData(response.data)
      } else {
        // TODO error handling if getPlotData fails
        console.error(response.message)
      }
    }

    // Currently hard-coded to match spec, but need to be queried and used to modify spec via controls
    const fields=[SAMPLE_ID_FIELD,'Date_coll','cgMLST','Serotype']
 
    if(plot){
      updatePlotData(fields)
    }

  }, [plot])

  return(
  <>
  {(spec && data) ? 
    <VegaLite spec={spec} data={{inputdata: data}}/> : <div>Loading plot</div>
   //TODO error banner; loading placeholder
  }
  </>)
}

export default ClusterTimeline;