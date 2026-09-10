import type React from 'react';
import ApgDashboard from '../components/Dashboards/Templates/ApgDashboard';
import ApgEchartsDashboard from '../components/Dashboards/Templates/ApgEchartsDashboard';
import DefaultDashboard from '../components/Dashboards/Templates/DefaultDashboard';
import DefaultEchartsDashboard from '../components/Dashboards/Templates/DefaultEchartsDashboard';
import DemoDashboard from '../components/Dashboards/Templates/DemoDashboard';
import DemoEchartsDashboard from '../components/Dashboards/Templates/DemoEchartsDashboard';
import LabDataDashboard from '../components/Dashboards/Templates/LabDataDashboard';
import OFNDashboard from '../components/Dashboards/Templates/OFNDashboard';
import OFNEchartsDashboard from '../components/Dashboards/Templates/OFNEchartsDashboard';
import PublicHealthDefaultDashboard from '../components/Dashboards/Templates/PublicHealthDefaultDashboard';
import PublicHealthDefaultEchartsDashboard from '../components/Dashboards/Templates/PublicHealthDefaultEchartsDashboard';
import SEDemoDashboard from '../components/Dashboards/Templates/SEDemoDashboard';
import SEDemoEchartsDashboard from '../components/Dashboards/Templates/SEDemoEchartsDashboard';
import SnapDashboard from '../components/Dashboards/Templates/SnapDashboard';
import SnapEchartsDashboard from '../components/Dashboards/Templates/SnapEchartsDashboard';
import SpeciesLabDataDashboard from '../components/Dashboards/Templates/SpeciesLabDataDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import WithQC from '../components/Dashboards/Templates/WithQC';
import WithQCEcharts from '../components/Dashboards/Templates/WithQCEcharts';
import type ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';

const DashboardTemplates: Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'public-health-default': PublicHealthDefaultDashboard,
  'public-health-default-echarts': PublicHealthDefaultEchartsDashboard,
  demo: DemoDashboard,
  'demo-echarts': DemoEchartsDashboard,
  default: DefaultDashboard,
  'default-echarts': DefaultEchartsDashboard,
  snap: SnapDashboard,
  'snap-echarts': SnapEchartsDashboard,
  vicdh: VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  apg: ApgDashboard,
  'apg-echarts': ApgEchartsDashboard,
  withqc: WithQC,
  'withqc-echarts': WithQCEcharts,
  'se-demo': SEDemoDashboard,
  'se-demo-echarts': SEDemoEchartsDashboard,
  ofn: OFNDashboard,
  'ofn-echarts': OFNEchartsDashboard,
  'lab-data': LabDataDashboard,
  'species-lab-data': SpeciesLabDataDashboard,
};
export default DashboardTemplates;
