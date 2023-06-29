import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchSubmittingOrgs } from '../components/Widgets/SubmittingOrgs/sumbittingOrgsSlice';

const DashboardTemplateActions: any = {
  vicdh: [fetchSummary, fetchStCounts, fetchSubmittingOrgs],
  default: [fetchSummary, fetchStCounts, fetchSubmittingOrgs],
};

export default DashboardTemplateActions;
