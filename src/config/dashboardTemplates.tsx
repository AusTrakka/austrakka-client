import React from 'react';
import BasicDashboard from '../components/Dashboards/Templates/BasicDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';
import ProjectDashboardTemplateProps from '../types/projectdashboardtemplate.props.interface';

const DashboardTemplates : Record<string, React.FC<ProjectDashboardTemplateProps>> = {
  'vicdh': VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  'default': BasicDashboard,
};
export default DashboardTemplates;
