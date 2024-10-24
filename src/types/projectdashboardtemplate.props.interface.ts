import { DataTableFilterMeta } from 'primereact/datatable';
import { Sample } from './sample.interface';

export default interface ProjectDashboardTemplateProps {
  projectAbbrev: string;
  filteredData: Sample[];
  timeFilterObject: DataTableFilterMeta;
}
