import BasicDashboard from '../components/Dashboards/Templates/BasicDashboard';
import VicDHAlertsDashboard from '../components/Dashboards/Templates/VicDHAlertsDashboard';
import VicDHDashboard from '../components/Dashboards/Templates/VicDHDashboard';

const DashboardTemplates :any = {
  'vicdh': VicDHDashboard,
  'vicdh-alerts': VicDHAlertsDashboard,
  'default': BasicDashboard,
};
export default DashboardTemplates;
