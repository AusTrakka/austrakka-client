// eslint-disable-next-line max-len
// import { ProjectDashboardComponent } from '../components/Dashboards/ProjectDashboard/project.dashboard.interface';
import { SampleSummary } from '../components/Widgets/SampleSummary/sample.summary.interface';
import { StCounts } from '../components/Widgets/StCounts/st.counts.interface';
import { SubmittingLabs } from '../components/Widgets/SubmittingLabs/submitting.labs.interface';

export interface AppState {
  sampleSummaryState: SampleSummary,
  submittingLabsState: SubmittingLabs,
  stCountsState: StCounts,
  projectDashboardState: any
}
