import React from 'react';
import DefaultDashboard from '../components/Dashboards/Templates/DefaultDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import ApgDashboard from '../components/Dashboards/Templates/ApgDashboard';
import ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';
import BasicDashboard from '../components/Dashboards/Templates/BasicDashboard';

const DashboardTemplates : Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'default': DefaultDashboard,
  'basic': BasicDashboard,
  'vicdh': VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  'apg': ApgDashboard,
};
export default DashboardTemplates;
