import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import sampleSummaryReducer from '../components/Widgets/SampleSummary/sampleSummarySlice';
import submittingLabsReducer from '../components/Widgets/SubmittingLabs/sumbittingLabsSlice';
import projectDashboardReducer from '../components/Dashboards/ProjectDashboard/projectDashboardSlice';
import stCountsReducer from '../components/Widgets/StCounts/stCountsSlice';

const store = configureStore({
  reducer: {
    sampleSummaryState: sampleSummaryReducer,
    submittingLabsState: submittingLabsReducer,
    stCountsState: stCountsReducer,
    projectDashboardState: projectDashboardReducer,
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware({
  //   serializableCheck: false,
  // }),
});

export default store;

// Declaring types of the essential Redux components (state and dispatches)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type safe useDispatch hook
export const useAppDispatch: () => AppDispatch = useDispatch;

// Type safe useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
