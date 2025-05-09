import React from 'react';
import PlotTypeProps from '../types/plottypeprops.interface';
import ClusterTimeline from '../components/Plots/PlotTypes/ClusterTimeline';
import EpiCurve from '../components/Plots/PlotTypes/EpiCurve';
import BarChart from '../components/Plots/PlotTypes/BarChart';
import Histogram from '../components/Plots/PlotTypes/Histogram';
import HeatMap from '../components/Plots/PlotTypes/HeatMap';
import Custom from '../components/Plots/PlotTypes/Custom';

export const plotTypes : { [index: string]: React.FunctionComponent<PlotTypeProps> } = {
  'ClusterTimeline': ClusterTimeline,
  'EpiCurve': EpiCurve,
  'BarChart': BarChart,
  'Histogram': Histogram,
  'HeatMap': HeatMap,
  'Custom': Custom,
};

// Does not include Custom
export const plotTypeListing = [
  {
    plotType: 'ClusterTimeline',
    name: 'Cluster timeline',
    description: 'Plot of sample clusters by date',
  },
  {
    plotType: 'EpiCurve',
    name: 'Epi curve',
    description: 'Histogram of sample counts by date',
  },
  {
    plotType: 'BarChart',
    name: 'Bar chart',
    description: 'Bar chart of sample counts by category',
  },
  {
    plotType: 'Histogram',
    name: 'Histogram',
    description: 'Histogram of sample counts against a numeric field',
  },
  {
    plotType: 'HeatMap',
    name: 'Heat map',
    description: 'Heat map of sample counts by categorical fields',
  },
];
