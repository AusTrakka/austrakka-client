import { DataTableFilterMeta } from 'primereact/datatable';
import { Sample } from './sample.interface';

export default interface ProjectWidgetProps {
  projectAbbrev: string;
  filteredData?: Sample[];
  timeFilterObject?: DataTableFilterMeta;
}
