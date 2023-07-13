import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import sampleSummaryReducer from '../components/Widgets/SampleSummary/sampleSummarySlice';
import submittingOrgsReducer from '../components/Widgets/SubmittingOrgs/sumbittingOrgsSlice';
import projectDashboardReducer from '../components/Dashboards/ProjectDashboard/projectDashboardSlice';
import stCountsReducer from '../components/Widgets/StCounts/stCountsSlice';
import qcStatusReducer from '../components/Widgets/QcStatus/qcStatusSlice';
import phessIdStatusReducer from '../components/Widgets/PhessIdStatus/phessIdStatusSlice';
import userDashboardReducer from '../components/Dashboards/UserDashboard/userDashboardSlice';
import userOverviewReducer from '../components/Widgets/UserOverview/userOverviewSlice';
import projectsTotalReducer from '../components/Widgets/ProjectsTotal/projectsTotalSlice';
import phessIdOverallReducer from '../components/Widgets/PhessIdOverall/phessIdOverallSlice';

const store = configureStore({
  reducer: {
    sampleSummaryState: sampleSummaryReducer,
    submittingOrgsState: submittingOrgsReducer,
    qcStatusState: qcStatusReducer,
    phessIdStatusState: phessIdStatusReducer,
    stCountsState: stCountsReducer,
    projectDashboardState: projectDashboardReducer,
    userDashboardState: userDashboardReducer,
    userOverviewState: userOverviewReducer,
    projectTotalState: projectsTotalReducer,
    phessIdOverallState: phessIdOverallReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false,
  }),
});

export default store;

// Declaring types of the essential Redux components (state and dispatches)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type safe useDispatch hook
export const useAppDispatch: () => AppDispatch = useDispatch;

// Type safe useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
