import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';

// TODO remove

// Actions/endpoint calls for each dashboard template that need to triggered dynamically
const DashboardTemplateActions: any = {
  'vicdh': [fetchSummary, fetchStCounts],
  'vicdh-alerts': [fetchSummary],
  'default': [fetchSummary],
};

export default DashboardTemplateActions;
