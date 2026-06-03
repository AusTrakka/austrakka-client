import type { DataTableFilterMeta } from 'primereact/datatable';
import type { Sample } from './sample.interface';

export enum WidgetType {
  Project = 'project',
  Organisation = 'organisation',
}

export default interface GenericWidgetProps {
  widgetType: WidgetType;
  identifier: string;
  filteredData?: Sample[];
  timeFilterObject?: DataTableFilterMeta;
}
