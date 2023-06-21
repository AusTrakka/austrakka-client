import React, { Dispatch } from 'react';
// Import dashboard templates
import BasicDashboard from '../components/Dashboards/Templates/BasicDashboard';
// Import dashboard widget dispatches
import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchSubmittingLabs } from '../components/Widgets/SubmittingLabs/sumbittingLabsSlice';

export const DashboardTemplates :any = {
  basic: BasicDashboard,
};

export const DashboardTemplateActions: any = {
  basic: [fetchSummary, fetchStCounts, fetchSubmittingLabs],
};

export default function renderDashboard(
  dashboardName: any,
  projectId: any,
  setFilterList: any,
  setTabValue: Dispatch<React.SetStateAction<number>>,
) {
  if (typeof DashboardTemplates[dashboardName] !== 'undefined') {
    return React.createElement(
      DashboardTemplates[dashboardName],
      { projectId, setFilterList, setTabValue },
    );
  }
  // Returns nothing if a matching React dashbaord template component doesn't exist
  return React.createElement(
    () => (
      null
    ),
  );
}
