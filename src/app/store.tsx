import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { listenerMiddleware } from './listenerMiddleware';
import projectMetadataReducer from './projectMetadataSlice';
import treeReducer from './treeSlice';

const store = configureStore({
  reducer: {
    projectMetadataState: projectMetadataReducer,
    treeState: treeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).prepend(listenerMiddleware.middleware),
});

export default store;

// Declaring types of the essential Redux components (state and dispatches)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type safe useDispatch hook
export const useAppDispatch: () => AppDispatch = useDispatch;

// Type safe useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
