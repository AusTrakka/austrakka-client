/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TreeVersion } from '../types/dtos';
import { LOCAL_PROJECT } from '../constants/standaloneClientConstants';
import type { RootState } from './store';

// Note that the projectMetadataSlice interfaces mimic the 
// "per-project" structure needed to support server-side functionality.
// The treeSlice however is only used in the standalone client and
// the slice state supports only one "project".
// The TreeVersion object does mimic the TreeVersion object used in the
// server-side version and contains some information we don't really need here.

export interface TreeState {
  trees: TreeVersion[];
}

const initialState: TreeState = {
  trees: [],
};

interface UploadedTree {
  treeName: string;
  newickTree: string;
}

const treeSlice = createSlice({
  name: 'treeSlice',
  initialState,
  reducers: {
    addTree: (state, action: PayloadAction<UploadedTree>) => {
      const nextTreeId = state.trees.length > 0
        ? Math.max(...state.trees.map((tree) => tree.treeVersionId)) + 1
        : 1;
      const now : string = new Date().toISOString();
      const newTreeVersion = {
        treeId: nextTreeId,
        treeVersionId: nextTreeId,
        treeName: action.payload.treeName,
        projectId: LOCAL_PROJECT.projectId,
        projectMembersGroupId: LOCAL_PROJECT.projectMembers.id,
        projectName: LOCAL_PROJECT.name,
        completedTime: now,
        wasScheduled: false,
        newickTree: action.payload.newickTree,
        isActive: true,
        versionName: now, // TODO fix - invalid date
        version: now,
        created: now,
        lastUpdated: now,
        createdBy: 'Local User', // TODO matches temporary hard-coding in userSlice
        lastUpdatedBy: 'Local User',
      };
      state.trees.push(newTreeVersion);
    },
  },
});

export default treeSlice.reducer;

export const { addTree } = treeSlice.actions;

export const selectTrees = (state: RootState) => state.treeState.trees;

// return tree, or errorMsg if cannot return tree
export const selectTreeById = (state: RootState, treeId: number) : [TreeVersion | null, string] => {
  // Find matching tree in list
  const tree = state.treeState.trees.find((tree) => tree.treeId === treeId);
  if (tree) {
    return [tree, ''];
  }
  return [null, `No tree found with ID ${treeId}`];
};
