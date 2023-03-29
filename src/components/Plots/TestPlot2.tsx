
import { Typography } from "@mui/material";
import { useState, memo, useEffect, useRef } from "react"
import { Vega, VegaLite, VisualizationSpec, SignalListener } from 'react-vega';
import {Config, TopLevelSpec, compile} from 'vega-lite';

// Fake data - replace for larger demo
const surveillanceCsv = `Seq_ID,cgMLST,Date_coll,Species,Serotype,Sex
Sample1,11,2020-02-10,S_enterica,Typhimurium,M
Sample2,180,2020-02-18,S_enterica,Typhimurium,F
Sample3,180,2020-02-20,S_enterica,Enteriditus,F
Sample4,180,2020-02-15,S_enterica,Enteriditus,F
Sample5,11,2020-02-15,S_enterica,Enteriditus,F
`

const hardcodedCsv = `a,b,c
1,"one",1
2,"two",4
3,"three",9
`

const hardcodedData = {
  'data_table': [
  {a:1, b:"one", c:1},
  {a:2, b:"two", c:4},
  {a:3, b:"three", c:9}
]}

const demoSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'A simple scatter plot',
  data: {
    values: hardcodedCsv,
    format: {type: "csv"}
  },
  params: [
    {
      name: "highlight",
      select: {
        type: "point",
        fields: ["a","b"]
      }
    }
  ],
  mark: 'point',
  encoding: {
    x: {field: 'a', type: 'quantitative'},
    y: {field: 'c', type: 'quantitative'},
    color: {
      condition: {
        param: "highlight",
        value: "red"
      },
      value: "grey"
    },
    tooltip: {field: 'b'}
  }
};

const demoTimeline: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'Categorical faceted timeline diagram with jitter - e.g. cluster timeline',
  data: {
    values: [surveillanceCsv],
    format: {type: "csv"}
  },
  transform: [
    {
      //"type": "formula",
      calculate: "0.8*sqrt(-2*log(random()))*cos(2*PI*random())",
      as: "jitter"
    }
  ],
  params: [
    {
      name: "highlight",
      select: {
        type: "point",
        fields: ["Date_coll","Seq_ID"]
      }
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
      condition: {
        param: "highlight",
        field: 'Source_type'
      },
      value: 'black'
    },
    tooltip: {field: 'Seq_ID', type: 'nominal'}
  }
};

interface selectedData {
  Seq_ID: string[],
  Date_coll: Date[]
}

// Documentation uses explicit ReactDOM.render, for the Vega or VegaLite component, with a target div, but that doesn't seem necessary
const TestPlot2 = () => {

  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [compiledSpec, setCompiledSpec] = useState<VisualizationSpec>({});

  useEffect(() => {
    setCompiledSpec(compile(demoTimeline).spec as VisualizationSpec);
  }, []);

  const highlightSignalHandler = useRef<SignalListener>((name: string, value: any) => {
    value = value as selectedData;
    console.log(value);
    if (value?.Seq_ID){
      setSelectedData(value?.Seq_ID);   // causes a re-render? 
    }else{
      setSelectedData([]);
    }
  })

  return(
    <>
    <Typography sx={{height: 50}}>
    Selected points: {selectedData.join(', ')}
    </Typography>
    <Vega spec={compiledSpec} signalListeners={{'highlight': highlightSignalHandler.current}}/>
    </>
  )
}

export default TestPlot2;