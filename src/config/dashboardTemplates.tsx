import type React from 'react';
import ApgDashboard from '../components/Dashboards/Templates/ApgDashboard';
import DefaultDashboard from '../components/Dashboards/Templates/DefaultDashboard';
import DemoDashboard from '../components/Dashboards/Templates/DemoDashboard';
import PublicHealthDefaultDashboard from '../components/Dashboards/Templates/PublicHealthDefaultDashboard';
import SEDemoDashboard from '../components/Dashboards/Templates/SEDemoDashboard';
import SnapDashboard from '../components/Dashboards/Templates/SnapDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import WithQC from '../components/Dashboards/Templates/WithQC';
import type ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';

const DashboardTemplates: Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'public-health-default': PublicHealthDefaultDashboard,
  demo: DemoDashboard,
  default: DefaultDashboard,
  snap: SnapDashboard,
  vicdh: VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  apg: ApgDashboard,
  withqc: WithQC,
  'se-demo': SEDemoDashboard,
};
export default DashboardTemplates;
