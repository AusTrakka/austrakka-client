import React, { useEffect } from 'react';
import { Button, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { TreeTypes, Phylocanvas } from '../PhylocanvasGL';
import { PhylocanvasNode } from '../../../types/phylocanvas.interface';
import { TreeExportFuctions } from '../Tree';
import { JobInstance } from '../../../types/dtos';
import isoDateLocalDate from '../../../utilities/helperUtils';

interface State {
  type: string,
}

interface TreeNavigationProps {
  state: State,
  currentVersion: string,
  versions: JobInstance[],
  selectedIds: string[],
  rootId: string,
  onChange: (
    event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>
  ) => void;
  onJumpToSubtree: (id: string) => void;
  phylocanvasRef: React.RefObject<TreeExportFuctions>,
}

export default function TreeNavigation(
  {
    state,
    currentVersion,
    versions,
    selectedIds,
    rootId,
    onChange,
    onJumpToSubtree,
    phylocanvasRef,
  }: TreeNavigationProps,
) {
  const navigate = useNavigate();
  const { projectAbbrev, analysisId } = useParams();
  const [nodes, setNodes] = React.useState<{ [key: string]: PhylocanvasNode } | null>(null);
  const [history, setHistory] = React.useState<Array<PhylocanvasNode>>([]);
  // the root is implicitly the -1th element of the history
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  useEffect(() => {
    // Don't do anything if phylocanvasRef or phylocanvasRef.current.nodes is not yet set
    const phyloNodes = phylocanvasRef?.current?.nodes;
    if (!phyloNodes) return;

    // Set the nodes state
    setNodes(phyloNodes.ids);
  }, [nodes, phylocanvasRef]);

  useEffect(() => {
    // sets the history when tree is loaded from URL
    if (rootId === '0') return;
    if (historyIndex !== -1) return;
    if (history.length !== 0) return;
    if (!nodes) return;
    const newHistory = [nodes[rootId]];
    setHistory(newHistory);
    setHistoryIndex(0);
  }, [history, nodes, historyIndex, rootId]);

  const handleGoToRoot = () => {
    if (nodes === null) return;
    onJumpToSubtree('0');
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, nodes['0']]);
    setHistoryIndex(newHistory.length);
    phylocanvasRef.current?.fitInCanvas();
  };

  const handleJumpToSubtree = () => {
    if (nodes) {
      const selectedNodes: PhylocanvasNode[] = selectedIds.map(
        (id) => nodes[id],
      ).filter((node) => node !== undefined);
      let mrca = Phylocanvas.getMRCA(selectedNodes);
      if (mrca) {
        while (mrca?.totalSubtreeLength === 0) {
          mrca = mrca.parent;
        }
        if (mrca === null) return;
        onJumpToSubtree(mrca?.id || '0');
        // append to history
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, mrca]);
        setHistoryIndex(newHistory.length);
        phylocanvasRef.current?.fitInCanvas();
      }
    }
  };

  const handleBack = () => {
    const newHistoryIndex = historyIndex - 1;
    setHistoryIndex(newHistoryIndex);
    onJumpToSubtree(history[newHistoryIndex]?.id || '0');
    phylocanvasRef.current?.fitInCanvas();
  };
  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newHistoryIndex = historyIndex + 1;
      setHistoryIndex(newHistoryIndex);
      onJumpToSubtree(history[newHistoryIndex]?.id || '0');
      phylocanvasRef.current?.fitInCanvas();
    }
  };
  const handleParent = () => {
    if (historyIndex >= 0) {
      const currentNode = history[historyIndex];
      const parent = currentNode?.parent;
      if (parent === null) return;
      const id = parent?.id || '0';
      onJumpToSubtree(id);
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, parent]);
      setHistoryIndex(newHistory.length);
      phylocanvasRef.current?.fitInCanvas();
    }
  };
  const resetHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };
  const versionClickHandler = (version: JobInstance) => {
    if (version.version === currentVersion) return;
    navigate(`/projects/${projectAbbrev}/trees/${analysisId}/versions/${version.jobInstanceId}`);
    setNodes(null);
    handleGoToRoot();
    resetHistory();
  };
  return (
    <Grid>
      <FormControl sx={{ marginY: 1 }} size="small" fullWidth>
        <InputLabel id="tree-version-label">Version</InputLabel>
        <Select
          fullWidth
          labelId="tree-version-label"
          id="tree-version"
          value={[currentVersion]}
          name="version"
          label="Version"
          onChange={onChange}
        >
          {
            versions.filter((version => version.version !== null)).map((version) => (
              <MenuItem
                key={version.jobInstanceId}
                value={version.version}
                onClick={() => { versionClickHandler(version); }}
              >
                {
                isoDateLocalDate(version.versionName.replaceAll('-', '/'))
                }
              </MenuItem>
            ))
          }
        </Select>
      </FormControl>
      <FormControl sx={{ marginY: 1 }} size="small" fullWidth>
        <InputLabel id="tree-type-label">Type</InputLabel>
        <Select
          fullWidth
          labelId="tree-type-label"
          id="tree-type"
          value={[state.type]}
          name="type"
          label="Type"
          onChange={onChange}
        >
          {
            Object.keys(TreeTypes).map((type) => (
              <MenuItem key={type} value={TreeTypes[type]}>{type}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
      <Button variant="outlined" disabled={rootId === '0'} fullWidth sx={{ marginBottom: 1 }} onClick={handleGoToRoot}>
        Go to Root
      </Button>
      <Button variant="outlined" disabled={selectedIds.length === 0} fullWidth sx={{ marginBottom: 1 }} onClick={handleJumpToSubtree}>
        Jump to subtree
      </Button>
      <ButtonGroup fullWidth>
        <Button variant="outlined" disabled={!history[historyIndex]?.parent} onClick={handleParent}>
          Parent
        </Button>
        <Button variant="outlined" disabled={historyIndex < 0} onClick={handleBack}>
          Back
        </Button>
        <Button variant="outlined" disabled={historyIndex >= history.length - 1} onClick={handleForward}>
          Forward
        </Button>
      </ButtonGroup>
    </Grid>
  );
}
