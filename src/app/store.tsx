import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { listenerMiddleware } from './listenerMiddleware';
import userDashboardReducer from '../components/Dashboards/UserDashboard/userDashboardSlice';
import userOverviewReducer from '../components/Widgets/UserOverview/userOverviewSlice';
import projectsTotalReducer from '../components/Widgets/ProjectsTotal/projectsTotalSlice';
import phessIdOverallReducer from '../components/Widgets/PhessIdOverall/phessIdOverallSlice';
import projectMetadataReducer from './projectMetadataSlice';
import groupMetadataReducer from './groupMetadataSlice';
import userReducer from './userSlice';

const store = configureStore({
  reducer: {
    userDashboardState: userDashboardReducer,
    userOverviewState: userOverviewReducer,
    projectTotalState: projectsTotalReducer,
    phessIdOverallState: phessIdOverallReducer,
    projectMetadataState: projectMetadataReducer,
    groupMetadataState: groupMetadataReducer,
    userState: userReducer,
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
