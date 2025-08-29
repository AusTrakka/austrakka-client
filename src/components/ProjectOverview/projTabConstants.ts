import { TabObjectRecord } from '../Common/CustomTabs';

export const PROJ_HOME_TAB = 'summary';

export const PROJ_TABS: TabObjectRecord = {
  summary: { index: 0, title: 'Summary' },
  samples: { index: 1, title: 'Samples' },
  trees: { index: 2, title: 'Trees' },
  plots: { index: 3, title: 'Plots' },
  members: { index: 4, title: 'Members' },
  proformas: { index: 5, title: 'Proformas' },
  datasets: { index: 6, title: 'Datasets' },
} as const;
