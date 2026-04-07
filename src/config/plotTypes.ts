import React from 'react';
import PlotTypeProps from '../types/plottypeprops.interface';
import ClusterTimeline from '../components/Plots/PlotTypes/ClusterTimeline';
import EpiCurve from '../components/Plots/PlotTypes/EpiCurve';
import BarChart from '../components/Plots/PlotTypes/BarChart';
import Histogram from '../components/Plots/PlotTypes/Histogram';
import HeatMap from '../components/Plots/PlotTypes/HeatMap';
import Custom from '../components/Plots/PlotTypes/Custom';

interface PlotTypeDescriptor {
  component: React.FC<PlotTypeProps>;
  name?: string;
  description?: string;
}

export const plotTypes : { [index: string]: PlotTypeDescriptor } = {
  'ClusterTimeline': {
    'component': ClusterTimeline,
    'name': 'Cluster timeline',
    'description': 'Plot of sample clusters by date',
  },
  'EpiCurve': {
    'component': EpiCurve,
    'name': 'Epi curve',
    'description': 'Histogram of sample counts by date',
  },
  'BarChart': {
    'component': BarChart,
    'name': 'Bar chart',
    'description': 'Bar chart of sample counts by category',
  },
  'Histogram': {
    'component': Histogram,
    'name': 'Histogram',
    'description': 'Histogram of sample counts against a numeric field',
  },
  'HeatMap': {
    'component': HeatMap,
    'name': 'Heat map',
    'description': 'Heat map of sample counts by categorical fields',
  },
  'Map': {
    'component': HeatMap,
    'name': 'Project Map',
    'description': 'Geographic distribution of samples',
  },
  'Custom': { // Should never be used as a generic type
    'component': Custom,
  }
};

// Does not include Custom
const plotTypeOrder = ['EpiCurve', 'ClusterTimeline', 'BarChart', 'Histogram', 'HeatMap', 'Map'];

export const plotTypeListing = plotTypeOrder.map(plotType =>  ({
    plotType,
    name: plotTypes[plotType].name,
    description: plotTypes[plotType].description,
  })
);
  
