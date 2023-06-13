import React, { Dispatch } from 'react';
// import { ResponseObject, getTotalSamples } from '../../utilities/resourceUtils';
import DashboardTimeFilter from '../../constants/dashboardTimeFilter';

// Importing all possible dashboard components
import SampleSummary from '../Widgets/SampleSummary/SampleSummary';
import SubmittingLabs from '../Widgets/SubmittingLabs/SubmittingLabs';
import StCounts from '../Widgets/StCounts/StCounts';
import { ComponentsType } from './ProjectDashboard/project.dashboard.interface';
import {fetchSummary} from "../Widgets/SampleSummary/sampleSummarySlice";
import {fetchStCounts} from "../Widgets/StCounts/stCountsSlice";
import {fetchSubmittingLabs} from "../Widgets/SubmittingLabs/sumbittingLabsSlice";

// OBJECT Components:
// Object that maps the React components (above) to the name we have
// given the components in the content JSON
// this would include ALL possible dashboard components
const Components:ComponentsType = {
  overview: SampleSummary,
  labSampleCounts: SubmittingLabs,
  stCounts: StCounts,
};

export const ComponentActions: any = {
  overview: fetchSummary,
  labSampleCounts: fetchSubmittingLabs,
  stCounts: fetchStCounts,
};

export default function renderComponent(
  component: { name: keyof ComponentsType ; width: number; order: number; },
  setFilterList: any, // TODO: Fix
  setTabValue: Dispatch<React.SetStateAction<number>>,
) {
  if (typeof Components[component.name] !== 'undefined') {
    return React.createElement(Components[component.name], { setFilterList, setTabValue });
  }
  // Returns nothing if a matching React component doesn't exist
  return React.createElement(
    () => (
      null
    ),
  );
}
