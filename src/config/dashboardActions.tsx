import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchSubmittingLabs } from '../components/Widgets/SubmittingLabs/sumbittingLabsSlice';

const DashboardTemplateActions: any = {
  test: [fetchSummary, fetchStCounts, fetchSubmittingLabs],
  default: [fetchSummary, fetchStCounts, fetchSubmittingLabs],
};

export default DashboardTemplateActions;
