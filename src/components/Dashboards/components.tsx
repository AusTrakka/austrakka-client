import React from 'react';
// import { ResponseObject, getTotalSamples } from '../../utilities/resourceUtils';
import DashboardTimeFilter from '../../constants/dashboardTimeFilter';

// Importing all possible dashboard components
import SampleSummary from '../Widgets/SampleSummary/SampleSummary';
import SubmittingLabs from '../Widgets/SubmittingLabs/SubmittingLabs';
import StCounts from '../Widgets/StCounts/StCounts';
import { ComponentsType } from './ProjectDashboard/project.dashboard.interface';

// OBJECT Components:
// Object that maps the React components (above) to the name we have
// given the components in the content JSON
// this would include ALL possible dashboard components
const Components:ComponentsType = {
  overview: SampleSummary,
  labSampleCounts: SubmittingLabs,
  stCounts: StCounts,
};

export default function renderComponent(
  component: { name: keyof ComponentsType ; width: number; order: number; },
  dateFilter: DashboardTimeFilter,
) {
  if (typeof Components[component.name] !== 'undefined') {
    return React.createElement(Components[component.name], {
      component,
      dateFilter,
    });
  }
  // Returns nothing if a matching React component doesn't exist
  return React.createElement(
    () => (
      null
    ),
  );
}
