
import { Stack } from "@mui/material";
import { useEffect } from "react"
import { VegaLite } from 'react-vega';
import {Config, TopLevelSpec, compile} from 'vega-lite';
import {  } from 'vega';

// Fake data - replace for larger demo
const surveillanceCsv = `Seq_ID,cgMLST,Date_coll,Species,Serotype,Sex
Sample1,11,2020-02-15,S_enterica,Typhimurium,M
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

const demoSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'A simple scatter plot',
  data: {
    values: hardcodedCsv,
    format: {type: "csv"}
  },
  mark: 'circle',
  encoding: {
    x: {field: 'a', type: 'quantitative'},
    y: {field: 'c', type: 'quantitative'},
    tooltip: {field: 'b'}
  }
};

const demoEpiCurve: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'A simple bar chart with embedded data.',
  data: {
    values: [surveillanceCsv],
    format: {type: "csv"}
  },
  width: 900,
  height: 250,
  mark: 'bar',
  encoding: {
    x: {field: 'Date_coll', type: 'temporal'},
    y: {aggregate: 'count'},
    color: {field: 'Sex'},
    tooltip: [{field: 'Date_coll', type: 'temporal'}, {aggregate: 'count'}]
  }
};
 
// Documentation uses explicit ReactDOM.render, for the Vega or VegaLite component, with a target div, but that doesn't seem necessary
// Can also pass in data as a separate prop to spec, to allow for updates
// Replace with demoEpiCurve and some realistic data for a trial epi curve
const TestPlot = () => {
  return(
    <VegaLite spec={demoSpec}/>
  )
}

export default TestPlot;