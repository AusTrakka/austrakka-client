
import { useEffect } from "react"
import { Vega, VisualizationSpec } from 'react-vega';
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
  mark: 'circle',
  encoding: {
    x: {field: 'a', type: 'quantitative'},
    y: {field: 'c', type: 'quantitative'},
    tooltip: {field: 'b'}
  }
};

// Full Vega spec - equivalent to vega-lite spec above
const demoFullSpec: VisualizationSpec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "A simple scatter plot",
  "background": "white",
  "padding": 5,
  "width": 200,
  "height": 200,
  "style": "cell",
  "data": [
    {
      "name": "data_table",
    },
    {
      "name": "data_0",
      "source": "data_table",
      "transform": [
        {
          "type": "filter",
          "expr": "isValid(datum[\"a\"]) && isFinite(+datum[\"a\"]) && isValid(datum[\"c\"]) && isFinite(+datum[\"c\"])"
        }
      ]
    }
  ],
  "marks": [
    {
      "name": "marks",
      "type": "symbol",
      "style": ["circle"],
      "from": {"data": "data_0"},
      "encode": {
        "update": {
          "opacity": {"value": 0.7},
          "fill": {"value": "#4c78a8"},
          "tooltip": {
            "signal": "isValid(datum[\"b\"]) ? datum[\"b\"] : \"\"+datum[\"b\"]"
          },
          "ariaRoleDescription": {"value": "circle"},
          "description": {
            "signal": "\"a: \" + (format(datum[\"a\"], \"\")) + \"; c: \" + (format(datum[\"c\"], \"\")) + \"; b: \" + (isValid(datum[\"b\"]) ? datum[\"b\"] : \"\"+datum[\"b\"])"
          },
          "x": {"scale": "x", "field": "a"},
          "y": {"scale": "y", "field": "c"},
          "shape": {"value": "circle"}
        }
      }
    }
  ],
  "scales": [
    {
      "name": "x",
      "type": "linear",
      "domain": {"data": "data_0", "field": "a"},
      "range": [0, {"signal": "width"}],
      "nice": true,
      "zero": true
    },
    {
      "name": "y",
      "type": "linear",
      "domain": {"data": "data_0", "field": "c"},
      "range": [{"signal": "height"}, 0],
      "nice": true,
      "zero": true
    }
  ],
  "axes": [
    {
      "scale": "x",
      "orient": "bottom",
      "gridScale": "y",
      "grid": true,
      "tickCount": {"signal": "ceil(width/40)"},
      "domain": false,
      "labels": false,
      "aria": false,
      "maxExtent": 0,
      "minExtent": 0,
      "ticks": false,
      "zindex": 0
    },
    {
      "scale": "y",
      "orient": "left",
      "gridScale": "x",
      "grid": true,
      "tickCount": {"signal": "ceil(height/40)"},
      "domain": false,
      "labels": false,
      "aria": false,
      "maxExtent": 0,
      "minExtent": 0,
      "ticks": false,
      "zindex": 0
    },
    {
      "scale": "x",
      "orient": "bottom",
      "grid": false,
      "title": "a",
      "labelFlush": true,
      "labelOverlap": true,
      "tickCount": {"signal": "ceil(width/40)"},
      "zindex": 0
    },
    {
      "scale": "y",
      "orient": "left",
      "grid": false,
      "title": "c",
      "labelOverlap": true,
      "tickCount": {"signal": "ceil(height/40)"},
      "zindex": 0
    }
  ]
}

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
const TestPlot = () => {
  return(
    <Vega spec={demoFullSpec} data={hardcodedData}/>
  )
}

export default TestPlot;