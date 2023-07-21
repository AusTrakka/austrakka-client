import { fetchPhessIdStatus } from '../components/Widgets/PhessIdStatus/phessIdStatusSlice';
import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchOrganisations } from '../components/Widgets/Organisations/organisationsSlice';

const DashboardTemplateActions: any = {
  vicdh: [fetchSummary, fetchStCounts, fetchOrganisations, fetchPhessIdStatus],
  default: [fetchSummary, fetchOrganisations],
};

export default DashboardTemplateActions;
