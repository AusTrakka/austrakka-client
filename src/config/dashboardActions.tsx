import { fetchPhessIdStatus } from '../components/Widgets/PhessIdStatus/phessIdStatusSlice';
import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchOrganisations } from '../components/Widgets/Organisations/organisationsSlice';

// Actions/endpoint calls for each dashboard template that need to triggered dynamically
const DashboardTemplateActions: any = {
  'vicdh': [fetchSummary, fetchStCounts, fetchOrganisations, fetchPhessIdStatus],
  'vicdh-alerts': [fetchSummary, fetchOrganisations, fetchPhessIdStatus],
  'default': [fetchSummary, fetchOrganisations],
};

export default DashboardTemplateActions;
