/* eslint-disable import/no-cycle */
import React, { Dispatch } from 'react';

// Importing all possible dashboard components
import SampleSummary from '../Widgets/SampleSummary/SampleSummary';
import Organisations from '../Widgets/Organisations/Organisations';
import StCounts from '../Widgets/StCounts/StCounts';
import { ComponentsType } from './ProjectDashboard/project.dashboard.interface';
import { fetchSummary } from '../Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../Widgets/StCounts/stCountsSlice';
import { fetchOrganisations } from '../Widgets/Organisations/organisationsSlice';

// OBJECT Components:
// Object that maps the React components (above) to the name we have
// given the components in the content JSON
// this would include ALL possible dashboard components
const Components:ComponentsType = {
  overview: SampleSummary,
  orgSampleCounts: Organisations,
  stCounts: StCounts,
};

export const ComponentActions: any = {
  overview: fetchSummary,
  orgSampleCounts: fetchOrganisations,
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
