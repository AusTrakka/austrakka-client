/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LOCAL_PROJECT } from '../constants/standaloneClientConstants';
import type { TreeVersion } from '../types/dtos';
import type { RootState } from './store';

// Note that the projectMetadataSlice interfaces mimic the
// "per-project" structure needed to support server-side functionality.
// The treeSlice however is only used in the standalone client and
// the slice state supports only one "project".
// The TreeVersion object does mimic the TreeVersion object used in the
// server-side version and contains some information we don't really need here.

export interface TreeState {
  trees: TreeVersion[];
  nextTreeIndex: number;
}

const initialState: TreeState = {
  trees: [],
  // This index value only ever increases, never decreases, and can uniquely name a tree if a name is not provided
  nextTreeIndex: 1,
};

interface UploadedTree {
  name: string | null;
  newickTree: string;
}

const treeSlice = createSlice({
  name: 'treeSlice',
  initialState,
  reducers: {
    addTree: (state, action: PayloadAction<UploadedTree>) => {
      const { name, newickTree } = action.payload;
      const now: string = new Date().toISOString();
      const newTreeVersion = {
        treeId: state.nextTreeIndex,
        treeVersionId: state.nextTreeIndex,
        treeName: name ?? `Tree ${state.nextTreeIndex}`,
        projectId: LOCAL_PROJECT.projectId,
        projectName: LOCAL_PROJECT.name,
        completedTime: now,
        wasScheduled: false,
        newickTree: newickTree,
        isActive: true,
        versionName: now, // TODO fix - invalid date
        version: now,
        created: now,
        lastUpdated: now,
        createdBy: 'Local User', // TODO matches temporary hard-coding in userSlice
        lastUpdatedBy: 'Local User',
      };
      state.nextTreeIndex += 1;
      state.trees.push(newTreeVersion);
    },
  },
});

export default treeSlice.reducer;

export const { addTree } = treeSlice.actions;

export const selectTrees = (state: RootState): TreeVersion[] => state.treeState.trees;

export const selectIfTreesAvailable = (state: RootState): boolean =>
  (state.treeState.trees?.length ?? 0) > 0;

export const selectNextTreeIndex = (state: RootState): number => state.treeState.nextTreeIndex;

// return tree, or errorMsg if cannot return tree
export const selectTreeById = (state: RootState, treeId: number): [TreeVersion | null, string] => {
  // Find matching tree in list
  const tree = state.treeState.trees.find((tree) => tree.treeId === treeId);
  if (tree) {
    return [tree, ''];
  }
  return [null, `No tree found with ID ${treeId}`];
};
