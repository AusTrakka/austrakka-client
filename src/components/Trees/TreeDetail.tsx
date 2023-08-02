import React, { SyntheticEvent, createRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Grid, SelectChangeEvent, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { JobInstance } from '../../types/dtos';
import { DisplayFields } from '../../types/fields.interface';
import { PhylocanvasMetadata } from '../../types/phylocanvas.interface';
import { ResponseObject, getTreeData, getLatestTreeData, getTreeVersions, getTreeMetaData, getGroupDisplayFields } from '../../utilities/resourceUtils';
import Tree, { TreeExportFuctions } from './Tree';
import { TreeTypes } from './PhylocanvasGL';
import MetadataControls from './TreeControls/Metadata';
import ExportButton from './TreeControls/Export';
import Search from './TreeControls/Search';
import NodeAndLabelControls from './TreeControls/NodeAndLabel';
import TreeNavigation from './TreeControls/TreeNavigation';
import mapMetadataToPhylocanvas from '../../utilities/treeUtils';
import isoDateLocalDate, { useStateFromSearchParamsForObject, useStateFromSearchParamsForPrimitive } from '../../utilities/helperUtils';
import TreeState from '../../types/tree.interface';

const defaultState: TreeState = {
  blocks: [],
  alignLabels: true,
  showBlockHeaders: true,
  blockHeaderFontSize: 13,
  blockPadding: 3,
  blockSize: 16,
  showLeafLabels: true,
  fontSize: 16,
  nodeSize: 6,
  type: TreeTypes.Rectangular,
  showInternalLabels: false,
  showBranchLengths: false,
  labelBlocks: [],
  keyValueLabelBlocks: false,
};

interface Style {
  label: string;
}

function TreeDetail() {
  const navigate = useNavigate();
  const { analysisId, jobInstanceId } = useParams();
  const [tree, setTree] = useState<JobInstance | null>();
  const treeRef = createRef<TreeExportFuctions>();
  const [phylocanvasMetadata, setPhylocanvasMetadata] = useState<PhylocanvasMetadata>({});
  const [displayFields, setDisplayFields] = useState<DisplayFields[]>([]);
  const [versions, setVersions] = useState<JobInstance[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [styles, setStyles] = useState<Record<string, Style>>({});
  const [state, setState] = useStateFromSearchParamsForObject(
    defaultState,
  );
  const rootIdDefault: string = '0';
  const searchParams = new URLSearchParams(window.location.search);
  const [rootId, setRootId] = useStateFromSearchParamsForPrimitive(
    'rootId',
    rootIdDefault,
    searchParams,
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Update the URL when state changes
  useEffect(() => {
    // Create a new URLSearchParams instance
    const currentSearchParams = new URLSearchParams(window.location.search);

    Object.entries(state).forEach(([key, value]) => {
      // If the key exists in the current searchParams, delete it
      if (currentSearchParams.has(key)) {
        currentSearchParams.delete(key);
      }
      // If the value differs from the default, append it to searchParams
      if (key in defaultState && value !== defaultState[key as keyof typeof state]) {
        if (!(value instanceof Array && value.length === 0)) {
          currentSearchParams.append(key, String(value));
        }
      }
    });

    // If the rootId exists in the current searchParams, delete it
    if (currentSearchParams.has('rootId')) {
      currentSearchParams.delete('rootId');
    }
    // If the rootId differs from the default, append it to searchParams
    if (rootId !== rootIdDefault) {
      currentSearchParams.append('rootId', String(rootId));
    }

    // Convert searchParams to a string
    const queryString = currentSearchParams.toString();
    // Update the URL without navigating
    navigate({ search: `?${queryString}` }, { replace: true });
  }, [state, navigate, rootId]);

  // control hooks
  useEffect(() => {
    const getMetadata = async () => {
      const metadataResponse: ResponseObject = await getTreeMetaData(
        Number(analysisId),
        Number(tree?.jobInstanceId),
      );
      if (metadataResponse.status === 'Success') {
        setPhylocanvasMetadata(mapMetadataToPhylocanvas(metadataResponse.data));
      } else {
        setErrorMsg(`Metadata for tree ${analysisId} could not be loaded`);
      }
    };
    const getDisplayFields = async () => {
      const displayFieldsResponse: ResponseObject = await getGroupDisplayFields(
        Number(tree?.projectMembersGroupId),
      );
      if (displayFieldsResponse.status === 'Success') {
        setDisplayFields(displayFieldsResponse.data);
      } else {
        setErrorMsg(`DisplayFields for tree ${analysisId} could not be loaded`);
      }
    };
    const getVersions = async () => {
      const versionsResponse: ResponseObject = await getTreeVersions(
        Number(analysisId),
      );
      if (versionsResponse.status === 'Success') {
        setVersions(versionsResponse.data);
      } else {
        setErrorMsg(`Versions for tree ${analysisId} could not be loaded`);
      }
    };
    if (tree) {
      getMetadata();
      getDisplayFields();
      getVersions();
    }
  }, [analysisId, tree]);

  useEffect(() => {
    if (phylocanvasMetadata) {
      const newStyles: Record<string, Style> = {};
      const delimiter = '|';
      // find the length of the longest label for each block
      const blockLengths: Record<string, number> = {};
      blockLengths.id = 0;
      for (const [nodeId, value] of Object.entries(phylocanvasMetadata)) {
        const nodeIdLength = nodeId.length;
        if (nodeIdLength > blockLengths.id) {
          blockLengths.id = nodeIdLength;
        }
        for (const [block, blockValue] of Object.entries(value)) {
          const length = blockValue.label ? blockValue.label.length : 0;
          // check if the block has been seen before
          if (!(block in blockLengths)) {
            blockLengths[block] = length;
          } else if (length > blockLengths[block]) {
            blockLengths[block] = blockValue.label.length;
          }
        }
      }
      for (const [nodeId, value] of Object.entries(phylocanvasMetadata)) {
        const label = state.labelBlocks.map(
          (block) => {
            if (!value[block].label) {
              return ' '.repeat(blockLengths[block]);
            }
            let prefix = '';
            if (state.keyValueLabelBlocks) {
              prefix = `${block}=`;
            }
            if (state.alignLabels) {
              return prefix + value[block].label.padEnd(blockLengths[block], ' ');
            }
            return prefix + value[block].label;
          },
        );
        const formattedBlocksString = `${label.length > 0 ? delimiter : ''}${label.join(delimiter)}`;
        if (state.alignLabels) {
          newStyles[nodeId] = { label: `${nodeId.padEnd(blockLengths.id, ' ')}${formattedBlocksString}` };
        } else {
          newStyles[nodeId] = { label: `${nodeId}${formattedBlocksString}` };
        }
      }
      setStyles(newStyles);
    }
  }, [state.labelBlocks, state.keyValueLabelBlocks, phylocanvasMetadata, state.alignLabels]);

  useEffect(() => {
    // Get tree details, including tree type
    const getTree = async () => {
      let treeResponse: ResponseObject;
      if (jobInstanceId === 'latest') {
        treeResponse = await getLatestTreeData(Number(analysisId));
      } else {
        treeResponse = await getTreeData(Number(jobInstanceId));
      }
      if (treeResponse.status === 'Success') {
        setTree(treeResponse.data);
      } else {
        setErrorMsg(`Tree ${analysisId} could not be loaded`);
      }
      setIsTreeLoading(false);
    };
    getTree();
  }, [analysisId, jobInstanceId]);

  const renderTree = () => {
    if (isTreeLoading) {
      return <Typography>Loading tree</Typography>;
    }
    if (errorMsg && errorMsg.length > 0) {
      return <Alert severity="error">{errorMsg}</Alert>;
    }

    if (tree) {
      return (
        <Tree
          ref={treeRef}
          source={tree.newickTree}
          resizeWidthTo=".treeContainer" // auto-resize width to container
          size={{ width: 600, height: 600 }}
          showLabels
          interactive
          metadata={phylocanvasMetadata}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          rootId={rootId}
          styles={styles}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...state}
        />
      );
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  };

  const handleSearch = (
    event: SyntheticEvent<Element, Event>,
    value: string[],
  ) => {
    setSelectedIds(value);
  };

  const handleStateChange = (
    event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>,
  ) => {
    // Detect if the event is coming from a checkbox
    const isCheckbox = (event.target as HTMLInputElement).checked !== undefined;
    setState({
      ...state,
      [event.target.name]:
        isCheckbox ? (event.target as HTMLInputElement).checked : event.target.value,
    });
  };

  const renderControls = () => {
    const visualisableColumns = displayFields.filter(
      (field) => field.canVisualise,
    ).map(field => field.columnName);
    const ids = Object.keys(phylocanvasMetadata);

    if (tree) {
      return (
        <Grid item xs={3} sx={{ minWidth: '250px', maxWidth: '300px' }}>
          <Grid item sx={{ marginBottom: 1 }}>
            <Search
              options={ids}
              selectedIds={selectedIds}
              onChange={handleSearch}
            />
          </Grid>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>Tree & Navigation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TreeNavigation
                state={state}
                rootId={rootId}
                currentVersion={tree.version}
                versions={versions}
                selectedIds={selectedIds}
                onChange={handleStateChange}
                onJumpToSubtree={(id: string) => setRootId(id)}
                phylocanvasRef={treeRef}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>Nodes & labels</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <NodeAndLabelControls
                columns={visualisableColumns}
                state={state}
                onChange={handleStateChange}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>Metadata</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MetadataControls
                columns={visualisableColumns}
                state={state}
                onChange={handleStateChange}
              />
            </AccordionDetails>
          </Accordion>
          <ExportButton analysisName={tree.analysisName} phylocanvasRef={treeRef} />
        </Grid>
      );
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  };

  return (
    <Grid container wrap="nowrap" spacing={2}>
      {renderControls()}
      <Grid item xs={9} className="treeContainer">
        <Typography className="pageTitle">
          {tree ? `${tree.analysisName} - ${isoDateLocalDate(tree.versionName.replaceAll('-', '/'))}` : ''}
          {tree && rootId !== '0' ? ` - Subtree ${rootId}` : ''}
        </Typography>
        {renderTree()}
      </Grid>
    </Grid>

  );
}

export default TreeDetail;
