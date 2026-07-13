import type { DataTableFilterMeta } from 'primereact/datatable';
import type { Sample } from './sample.interface';

export enum WidgetType {
  Project = 'project',
  Organisation = 'organisation',
}

export interface GenericMetadataWidgetProps {
  widgetType: WidgetType;
  identifier: string;
  filteredData: Sample[];
  timeFilterObject?: DataTableFilterMeta;
}
