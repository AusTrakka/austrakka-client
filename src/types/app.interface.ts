// eslint-disable-next-line max-len
// import { ProjectDashboardComponent } from '../components/Dashboards/ProjectDashboard/project.dashboard.interface';
import { PhessIdStatus } from '../components/Widgets/PhessIdStatus/phess.id.interface';
import { QcStatus } from '../components/Widgets/QcStatus/qc.status.interface';
import { SampleSummary } from '../components/Widgets/SampleSummary/sample.summary.interface';
import { StCounts } from '../components/Widgets/StCounts/st.counts.interface';
import { Organisations } from '../components/Widgets/Organisations/organisations.interface';
import { ThresholdAlerts } from '../components/Widgets/ThresholdAlerts/threshold.alerts.inferface';

export interface AppState {
  sampleSummaryState: SampleSummary,
  organisationsState: Organisations,
  qcStatusState: QcStatus,
  phessIdStatusState: PhessIdStatus,
  stCountsState: StCounts,
  thresholdAlertsState: ThresholdAlerts,
  projectDashboardState: any,
  userDashboardState: any,
  userOverviewState: any,
  projectTotalState: any,
  phessIdOverallState: any,
  userState: any,
}
