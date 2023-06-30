import { fetchPhessIdStatus } from '../components/Widgets/PhessIdStatus/phessIdStatusSlice';
import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchSubmittingOrgs } from '../components/Widgets/SubmittingOrgs/sumbittingOrgsSlice';

const DashboardTemplateActions: any = {
  vicdh: [fetchSummary, fetchStCounts, fetchSubmittingOrgs, fetchPhessIdStatus],
  default: [fetchSummary, fetchSubmittingOrgs],
};

export default DashboardTemplateActions;
