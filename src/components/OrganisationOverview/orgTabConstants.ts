import type { TabObjectRecord } from '../Common/CustomTabs';

export const ORG_HOME_TAB = 'dashboard';

export const ORG_TABS: TabObjectRecord = {
  dashboard: { index: 0, title: 'Dashboard' },
  samples: { index: 1, title: 'Samples' },
  members: { index: 2, title: 'Members' },
  activity: { index: 3, title: 'Activity' },
};
