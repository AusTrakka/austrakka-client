import React from 'react';
import DefaultDashboard from '../components/Dashboards/Templates/DefaultDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import ApgDashboard from '../components/Dashboards/Templates/ApgDashboard';
import ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';
import BasicDashboard from '../components/Dashboards/Templates/BasicDashboard';
import SnapDashboard from '../components/Dashboards/Templates/SnapDashboard';
import WithQC from '../components/Dashboards/Templates/WithQC';
import DemoDashboard from '../components/Dashboards/Templates/DemoDashboard';

const DashboardTemplates : Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'default': DefaultDashboard,
  'demo': DemoDashboard,
  'basic': BasicDashboard,
  'snap': SnapDashboard,
  'vicdh': VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  'apg': ApgDashboard,
  'withqc': WithQC,
};
export default DashboardTemplates;
