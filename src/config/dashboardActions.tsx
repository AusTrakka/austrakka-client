import { fetchPhessIdStatus } from '../components/Widgets/PhessIdStatus/phessIdStatusSlice';
import { fetchSummary } from '../components/Widgets/SampleSummary/sampleSummarySlice';
import { fetchStCounts } from '../components/Widgets/StCounts/stCountsSlice';
import { fetchOrganisations } from '../components/Widgets/Organisations/organisationsSlice';
import { fetchThresholdAlerts } from '../components/Widgets/ThresholdAlerts/thresholdAlertsSlice';

const DashboardTemplateActions: any = {
  'vicdh': [fetchSummary, fetchStCounts, fetchOrganisations, fetchPhessIdStatus],
  'vicdh-alerts': [fetchSummary, fetchOrganisations, fetchThresholdAlerts],
  'default': [fetchSummary, fetchOrganisations],
};

export default DashboardTemplateActions;
