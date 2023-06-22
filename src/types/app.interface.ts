// eslint-disable-next-line max-len
// import { ProjectDashboardComponent } from '../components/Dashboards/ProjectDashboard/project.dashboard.interface';
import { SampleSummary } from '../components/Widgets/SampleSummary/sample.summary.interface';
import { StCounts } from '../components/Widgets/StCounts/st.counts.interface';
import { SubmittingOrgs } from '../components/Widgets/SubmittingOrgs/submitting.orgs.interface';

export interface AppState {
  sampleSummaryState: SampleSummary,
  submittingOrgsState: SubmittingOrgs,
  stCountsState: StCounts,
  projectDashboardState: any
}
