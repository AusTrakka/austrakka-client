import type { TabObjectRecord } from '../Common/CustomTabs';

export const PROJ_HOME_TAB = 'dashboard';

export const PROJ_TABS: TabObjectRecord = {
  dashboard: { index: 0, title: 'Dashboard' },
  samples: { index: 1, title: 'Samples' },
  trees: { index: 2, title: 'Trees' },
  plots: { index: 3, title: 'Plots' },
  summaries: { index: 4, title: 'Summaries' },
  members: { index: 5, title: 'Members' },
  proformas: { index: 6, title: 'Proformas' },
  datasets: { index: 7, title: 'Datasets' },
  documents: { index: 8, title: 'Documents' },
  activity: { index: 9, title: 'Activity' },
} as const;
