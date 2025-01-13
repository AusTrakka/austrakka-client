import React from 'react';
import BasicDashboard from '../components/Dashboards/Templates/BasicDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import ApgDashboard from '../components/Dashboards/Templates/ApgDashboard';
import ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';

const DashboardTemplates : Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'default': BasicDashboard,
  'vicdh': VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  'apg': ApgDashboard,
};
export default DashboardTemplates;
