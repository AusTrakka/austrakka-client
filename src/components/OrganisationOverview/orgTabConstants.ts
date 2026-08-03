import type { TabObjectRecord } from '../Common/CustomTabs';

export const ORG_HOME_TAB = 'dashboard';

export const ORG_TABS: TabObjectRecord = {
  dashboard: { index: 0, title: 'Dashboard' },
  samples: { index: 1, title: 'Samples' },
  summaries: { index: 2, title: 'Summaries' },
  members: { index: 3, title: 'Members' },
  activity: { index: 4, title: 'Activity' },
};
