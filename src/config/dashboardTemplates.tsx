import type React from 'react';
import ApgEchartsDashboard from '../components/Dashboards/Templates/ApgEchartsDashboard';
import DefaultEchartsDashboard from '../components/Dashboards/Templates/DefaultEchartsDashboard';
import DemoEchartsDashboard from '../components/Dashboards/Templates/DemoEchartsDashboard';
import LabDataDashboard from '../components/Dashboards/Templates/LabDataDashboard';
import OFNEchartsDashboard from '../components/Dashboards/Templates/OFNEchartsDashboard';
import PublicHealthDefaultEchartsDashboard from '../components/Dashboards/Templates/PublicHealthDefaultEchartsDashboard';
import SEDemoEchartsDashboard from '../components/Dashboards/Templates/SEDemoEchartsDashboard';
import SnapEchartsDashboard from '../components/Dashboards/Templates/SnapEchartsDashboard';
import SpeciesLabDataDashboard from '../components/Dashboards/Templates/SpeciesLabDataDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import WithQCEcharts from '../components/Dashboards/Templates/WithQCEcharts';
import type ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';

const DashboardTemplates: Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'public-health-default': PublicHealthDefaultEchartsDashboard,
  demo: DemoEchartsDashboard,
  default: DefaultEchartsDashboard,
  snap: SnapEchartsDashboard,
  vicdh: VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  apg: ApgEchartsDashboard,
  'apg-echarts': ApgEchartsDashboard,
  withqc: WithQCEcharts,
  'withqc-echarts': WithQCEcharts,
  'se-demo': SEDemoEchartsDashboard,
  ofn: OFNEchartsDashboard,
  'lab-data': LabDataDashboard,
  'species-lab-data': SpeciesLabDataDashboard,
};
export default DashboardTemplates;
