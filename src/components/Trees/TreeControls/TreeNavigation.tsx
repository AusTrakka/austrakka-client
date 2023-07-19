import * as React from 'react';
import { Button, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { TreeTypes, Phylocanvas } from '../PhylocanvasGL';
import { PhylocanvasNode } from '../../../types/phylocanvas.interface';
import { TreeExportFuctions } from '../Tree';
import { JobInstance } from '../../../types/dtos';

interface State {
  type: string,
}

interface TreeNavigationProps {
  state: State,
  currentVersion: string,
  versions: JobInstance[],
  selectedIds: string[],
  onChange: (
    event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>
  ) => void;
  onJumpToSubtree: (id: string | null) => void;
  phylocanvasRef: React.RefObject<TreeExportFuctions>,
}

export default function TreeNavigation(
  {
    state,
    currentVersion,
    versions,
    selectedIds,
    onChange,
    onJumpToSubtree,
    phylocanvasRef,
  }: TreeNavigationProps,
) {
  const navigate = useNavigate();
  const { projectAbbrev, analysisId } = useParams();
  const [nodes, setNodes] = React.useState<{ [key: string]: PhylocanvasNode } | null>(null);
  const [history, setHistory] = React.useState<Array<PhylocanvasNode | null>>([null]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(0);

  React.useEffect(() => {
    // Don't do anything if phylocanvasRef or phylocanvasRef.current.nodes is not yet set
    const phyloNodes = phylocanvasRef?.current?.nodes;
    if (!phyloNodes) return;

    // Set the nodes state
    setNodes(phyloNodes.ids);
  }, [nodes, phylocanvasRef]);

  const handleJumpToSubtree = () => {
    if (nodes) {
      const selectedNodes: PhylocanvasNode[] = selectedIds.map((id) => nodes[id]);
      let mrca = Phylocanvas.getMRCA(selectedNodes);
      if (mrca) {
        while (mrca?.totalSubtreeLength === 0) {
          mrca = mrca.parent;
        }
        onJumpToSubtree(mrca?.id || null);
        // append to history
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, mrca]);
        setHistoryIndex(newHistory.length);
        phylocanvasRef.current?.fitInCanvas();
      }
    }
  };
  const handleGoToRoot = () => {
    onJumpToSubtree(null);
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, null]);
    setHistoryIndex(newHistory.length);
    phylocanvasRef.current?.fitInCanvas();
  };
  const handleBack = () => {
    if (historyIndex > 0) {
      const newHistoryIndex = historyIndex - 1;
      setHistoryIndex(newHistoryIndex);
      onJumpToSubtree(history[newHistoryIndex]?.id || null);
      phylocanvasRef.current?.fitInCanvas();
    }
  };
  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newHistoryIndex = historyIndex + 1;
      setHistoryIndex(newHistoryIndex);
      onJumpToSubtree(history[newHistoryIndex]?.id || null);
      phylocanvasRef.current?.fitInCanvas();
    }
  };
  const handleParent = () => {
    if (historyIndex >= 0) {
      const currentNode = history[historyIndex];
      const parent = currentNode?.parent || null;
      const id = parent?.id || null;
      onJumpToSubtree(id);
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, parent]);
      setHistoryIndex(newHistory.length);
      phylocanvasRef.current?.fitInCanvas();
    }
  };
  const resetHistory = () => {
    setHistory([null]);
    setHistoryIndex(0);
  };
  const versionClickHandler = (version: any) => {
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
                onClick={() => versionClickHandler(version)}
              >
                {version.versionName}
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
      <Button variant="outlined" disabled={!history[historyIndex]?.parent} fullWidth sx={{ marginBottom: 1 }} onClick={handleGoToRoot}>
        Go to Root
      </Button>
      <Button variant="outlined" disabled={selectedIds.length === 0} fullWidth sx={{ marginBottom: 1 }} onClick={handleJumpToSubtree}>
        Jump to subtree
      </Button>
      <ButtonGroup fullWidth>
        <Button variant="outlined" disabled={!history[historyIndex]?.parent} onClick={handleParent}>
          Parent
        </Button>
        <Button variant="outlined" disabled={historyIndex <= 0} onClick={handleBack}>
          Back
        </Button>
        <Button variant="outlined" disabled={historyIndex >= history.length - 1} onClick={handleForward}>
          Forward
        </Button>
      </ButtonGroup>
    </Grid>
  );
}
