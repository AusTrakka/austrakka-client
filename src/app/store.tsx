import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { listenerMiddleware } from './listenerMiddleware';
import sampleSummaryReducer from '../components/Widgets/SampleSummary/sampleSummarySlice';
import organisationsReducer from '../components/Widgets/Organisations/organisationsSlice';
import projectDashboardReducer from '../components/Dashboards/ProjectDashboard/projectDashboardSlice';
import stCountsReducer from '../components/Widgets/StCounts/stCountsSlice';
import thresholdAlertsReducer from '../components/Widgets/ThresholdAlerts/thresholdAlertsSlice';
import qcStatusReducer from '../components/Widgets/QcStatus/qcStatusSlice';
import phessIdStatusReducer from '../components/Widgets/PhessIdStatus/phessIdStatusSlice';
import userDashboardReducer from '../components/Dashboards/UserDashboard/userDashboardSlice';
import userOverviewReducer from '../components/Widgets/UserOverview/userOverviewSlice';
import projectsTotalReducer from '../components/Widgets/ProjectsTotal/projectsTotalSlice';
import phessIdOverallReducer from '../components/Widgets/PhessIdOverall/phessIdOverallSlice';
import projectMetadataReducer from './projectMetadataSlice';
import groupMetadataReducer from './groupMetadataSlice';

const store = configureStore({
  reducer: {
    sampleSummaryState: sampleSummaryReducer,
    organisationsState: organisationsReducer,
    qcStatusState: qcStatusReducer,
    phessIdStatusState: phessIdStatusReducer,
    stCountsState: stCountsReducer,
    thresholdAlertsState: thresholdAlertsReducer,
    projectDashboardState: projectDashboardReducer,
    userDashboardState: userDashboardReducer,
    userOverviewState: userOverviewReducer,
    projectTotalState: projectsTotalReducer,
    phessIdOverallState: phessIdOverallReducer,
    projectMetadataState: projectMetadataReducer,
    groupMetadataState: groupMetadataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .prepend(listenerMiddleware.middleware),
});

export default store;

// Declaring types of the essential Redux components (state and dispatches)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type safe useDispatch hook
export const useAppDispatch: () => AppDispatch = useDispatch;

// Type safe useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
