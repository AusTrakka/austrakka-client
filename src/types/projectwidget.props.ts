import type { DataTableFilterMeta } from 'primereact/datatable';
import type { Sample } from './sample.interface';

export default interface ProjectWidgetProps {
  projectAbbrev: string;
  filteredData?: Sample[];
  timeFilterObject?: DataTableFilterMeta;
}
