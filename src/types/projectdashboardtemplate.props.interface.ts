import { DataTableFilterMeta } from 'primereact/datatable';
import { Sample } from './sample.interface';

export default interface ProjectDashboardTemplateProps {
  projectAbbrev: string;
  projectId: number; // TODO remove
  groupId: number; // TODO remove
  filteredData: Sample[];
  timeFilterObject: DataTableFilterMeta;
}
