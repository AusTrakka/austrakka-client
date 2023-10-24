import React, { SyntheticEvent, createRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, Box, Grid, SelectChangeEvent, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { JobInstance, DisplayField } from '../../types/dtos';
import { PhylocanvasLegends, PhylocanvasMetadata } from '../../types/phylocanvas.interface';
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
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';

const defaultState: TreeState = {
  blocks: [],
  nodeColumn: '',
  alignLabels: true,
  showBlockHeaders: true,
  blockHeaderFontSize: 13,
  blockPadding: 3,
  blockSize: 16,
  showLeafLabels: true,
  fontSize: 16,
  nodeSize: 6,
  fillColour: 'rgba(0,0,0,1)',
  type: TreeTypes.Rectangular,
  showInternalLabels: false,
  showBranchLengths: false,
  labelBlocks: [],
  keyValueLabelBlocks: false,
};

interface Style {
  label: string;
  fillColour?: string;
}

function TreeDetail() {
  const { projectAbbrev, analysisId, jobInstanceId } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState<JobInstance | null>();
  const treeRef = createRef<TreeExportFuctions>();
  const legRef = createRef<HTMLDivElement>();
  const [phylocanvasMetadata, setPhylocanvasMetadata] = useState<PhylocanvasMetadata>({});
  const [phylocanvasLegends, setPhylocanvasLegends] = useState<PhylocanvasLegends>({});
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);
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
  const { token, tokenLoading } = useApi();

  // control hooks
  useEffect(() => {
    const fetchData = async () => {
      const metadataResponse = await getTreeMetaData(
        Number(analysisId),
        Number(tree?.jobInstanceId),
        token,
      );

      const displayFieldsResponse = await getGroupDisplayFields(
        Number(tree?.projectMembersGroupId),
        token,
      );

      const versionsResponse = await getTreeVersions(Number(analysisId), token);

      if (
        metadataResponse.status === 'Success' &&
      displayFieldsResponse.status === 'Success' &&
      versionsResponse.status === 'Success'
      ) {
        const mappingData = mapMetadataToPhylocanvas(
          metadataResponse.data,
          displayFieldsResponse.data,
        );
        setPhylocanvasMetadata(mappingData.result);
        setPhylocanvasLegends(mappingData.legends);
        setDisplayFields(displayFieldsResponse.data);
        setVersions(versionsResponse.data);
      } else {
        setErrorMsg(`Failed to load data for tree ${analysisId}`);
      }
    };

    if (tree && tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      fetchData();
    }
  }, [analysisId, tree, token, tokenLoading]);

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
            let prefix = '';
            const blockLength = blockLengths[block];
            if (state.keyValueLabelBlocks) {
              prefix = `${block}=`;
            }
            if (!value[block]?.label) {
              return prefix + ' '.repeat(blockLength);
            }
            if (state.alignLabels) {
              return prefix + value[block].label.padEnd(blockLength, ' ');
            }
            return prefix + value[block].label;
          },
        );
        const formattedBlocksString = `${label.length > 0 ? delimiter : ''}${label.join(delimiter)}`;
        if (state.alignLabels && formattedBlocksString.length > 0) {
          newStyles[nodeId] = { label: `${nodeId.padEnd(blockLengths.id, ' ')}${formattedBlocksString}` };
        } else {
          newStyles[nodeId] = { label: `${nodeId}${formattedBlocksString}` };
        }
        if (state.nodeColumn !== '') {
          newStyles[nodeId].fillColour = value[state.nodeColumn].colour;
        }
      }
      setStyles(newStyles);
    }
  }, [state.labelBlocks,
    state.keyValueLabelBlocks,
    phylocanvasMetadata,
    state.alignLabels,
    state.nodeColumn]);

  useEffect(() => {
    // Get tree details, including tree type
    const getTree = async () => {
      let treeResponse: ResponseObject;
      if (jobInstanceId === 'latest') {
        treeResponse = await getLatestTreeData(Number(analysisId), token);
      } else {
        treeResponse = await getTreeData(Number(jobInstanceId), token);
      }
      if (treeResponse.status === 'Success') {
        setTree(treeResponse.data);
      } else {
        setErrorMsg(treeResponse.message);
      }
      setIsTreeLoading(false);
    };
    if (tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      getTree();
    }
  }, [analysisId, jobInstanceId, token, tokenLoading]);

  const renderTree = () => {
    if (isTreeLoading) {
      return <Typography>Loading tree</Typography>;
    }
    if (errorMsg && errorMsg.length > 0) {
      return (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMsg}
        </Alert>
      );
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
    const allColumns = displayFields.map(field => field.columnName);
    const visualisableColumns = displayFields.filter(
      (field) => field.canVisualise,
    ).map(field => field.columnName);
    const ids = Object.keys(phylocanvasMetadata);

    const handleJumpToSubtree = (id: string) => {
      if (!tree) return;
      navigate(`/projects/${projectAbbrev}/trees/${analysisId}/versions/${tree.jobInstanceId}`, { replace: true });
      setRootId(id);
    };

    if (tree) {
      return (
        <Grid item xs={3} sx={{ minWidth: '250px', maxWidth: '300px' }}>
          {/*  */}
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
                onJumpToSubtree={handleJumpToSubtree}
                phylocanvasRef={treeRef}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>Nodes & Labels</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <NodeAndLabelControls
                columns={allColumns}
                visualColumns={visualisableColumns}
                state={state}
                onChange={handleStateChange}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>Metadata blocks</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MetadataControls
                columns={visualisableColumns}
                state={state}
                onChange={handleStateChange}
              />
            </AccordionDetails>
          </Accordion>
          <ExportButton
            analysisName={tree.analysisName}
            phylocanvasRef={treeRef}
            legendRef={legRef}
          />
        </Grid>

      );
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  };

  const renderLegend = () => {
    function generateLegend(selectedColumn : string) {
      const legendValues = phylocanvasLegends[selectedColumn];
      if (!legendValues) {
        return null; // Handle the case where the selected column doesn't exist
      }

      return (
        <>
          <Typography variant="body2" fontWeight="bold">{selectedColumn}</Typography>
          <Grid container spacing={1} sx={{ marginBottom: '8px' }}>
            {Object.entries(legendValues).map(([label, color]) => (
              <Grid item key={color}>
                <Box display="flex" alignItems="center">
                  <Box
                    width="10px"
                    height="10px"
                    bgcolor={color}
                    marginRight="10px"
                  />
                  <Typography variant="caption">{label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      );
    }
    if (tree && (state.nodeColumn !== '' || state.blocks.length !== 0)) {
      return (
        <Box sx={{ marginTop: '20px' }} ref={legRef}>
          {/* Only render node colour entry if not already in the legend  */}
          {(state.nodeColumn !== '' && !state.blocks.includes(state.nodeColumn)) && (
          <>
            {generateLegend(state.nodeColumn)}
          </>
          )}
          {state.blocks.map((block) => (
            block !== '' && (
            <div key={block}>
              {generateLegend(block)}
            </div>
            )
          ))}
        </Box>
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
        {renderLegend()}
      </Grid>
    </Grid>

  );
}

export default TreeDetail;
