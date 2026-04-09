import type { TabObjectRecord } from '../Common/CustomTabs';

export const PROJ_HOME_TAB = 'samples';

export const PROJ_TABS: TabObjectRecord = {
  samples: { index: 0, title: 'Samples' },
  trees: { index: 1, title: 'Trees' },
  plots: { index: 2, title: 'Plots' },
} as const;

// TODO could sort by index
// export const PROJ_TABS_LIST = [
//   PROJ_TABS.samples, PROJ_TABS.trees, PROJ_TABS.plots
// ]

export const PROJ_TABS_LIST = Object.values(PROJ_TABS)
  .sort((a, b) => a.index - b.index);
