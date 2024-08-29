import React, { SyntheticEvent, createRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, Box, Grid, SelectChangeEvent, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { JobInstance } from '../../types/dtos';
import { FieldAndColourScheme, PhylocanvasLegends, PhylocanvasMetadata } from '../../types/phylocanvas.interface';
import { getTreeData, getLatestTreeData, getTreeVersions } from '../../utilities/resourceUtils';
import Tree, { TreeExportFuctions } from './Tree';
import { TreeTypes } from './PhylocanvasGL';
import MetadataControls from './TreeControls/Metadata';
import ExportButton from './TreeControls/Export';
import Search from './TreeControls/Search';
import NodeAndLabelControls from './TreeControls/NodeAndLabel';
import TreeNavigation from './TreeControls/TreeNavigation';
import mapMetadataToPhylocanvas from '../../utilities/treeUtils';
import TreeState from '../../types/tree.interface';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import ColorSchemeSelector from './TreeControls/SchemeSelector';
import TreeTable from './TreeTable';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import {
  selectProjectMetadata, ProjectMetadataState, fetchProjectMetadata,
} from '../../app/projectMetadataSlice';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { Sample } from '../../types/sample.interface';
import { isoDateLocalDate, isoDateLocalDateNoTime } from '../../utilities/dateUtils';
import { useStateFromSearchParamsForObject, useStateFromSearchParamsForPrimitive } from '../../utilities/stateUtils';

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
  showShapes: true,
};

interface Style {
  label: string;
  fillColour?: string;
}

// This regex finds all node names in a newick tree
// Note that:
//  - it is less conservative than our Seq_ID regex, only checking newick constraints
//  - the presence of ) in the first []+ means that internal node names will also be captured,
//    if there are any
const treenameRegex = /[(,]+([^;:[\s,()]+)/g;

function TreeDetail() {
  const { projectAbbrev, analysisId, jobInstanceId } = useParams();
  const [tree, setTree] = useState<JobInstance | null>();
  const treeRef = createRef<TreeExportFuctions>();
  const legRef = createRef<HTMLDivElement>();
  const [treeSampleNames, setTreeSampleNames] = useState<string[]>([]);
  const [tableMetadata, setTableMetadata] = useState<Sample[]>([]);
  const [phylocanvasMetadata, setPhylocanvasMetadata] = useState<PhylocanvasMetadata>({});
  const [phylocanvasLegends, setPhylocanvasLegends] = useState<PhylocanvasLegends>({});
  const [versions, setVersions] = useState<JobInstance[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [styles, setStyles] = useState<Record<string, Style>>({});
  const [colourSchemeMapping, setColourSchemeMapping] = useState<FieldAndColourScheme>({});
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
  const projectMetadata : ProjectMetadataState | null =
    useAppSelector(st => selectProjectMetadata(st, projectAbbrev));

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();

  // Request redux data if not loaded
  useEffect(() => {
    if (projectAbbrev &&
       tokenLoading !== LoadingState.LOADING &&
       tokenLoading !== LoadingState.IDLE) {
      dispatch(fetchProjectMetadata({ projectAbbrev, token }));
    }
  }, [projectAbbrev, dispatch, token, tokenLoading]);

  useEffect(() => {
    // Get list of Seq_IDs from newick
    if (tree) {
      const matches = Array.from(tree.newickTree.matchAll(treenameRegex), m => m[1]);
      // natural sort with collator
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      matches.sort(collator.compare);
      if (matches) {
        setTreeSampleNames(matches ?? []);
      }
    }
  }, [tree]);

  useEffect(() => {
    // Filter metadata by tree samples
    if (projectMetadata?.metadata && treeSampleNames.length > 0) {
      const treeSamplesSet = new Set(treeSampleNames);
      const filteredMetadata = projectMetadata.metadata.filter(
        (row) => treeSamplesSet.has(row.Seq_ID),
      );
      setTableMetadata(filteredMetadata);
    }
  }, [projectMetadata?.metadata, treeSampleNames]);

  // Map group tabular metadata to format for phylocanvas, including colour mappings
  useEffect(() => {
    if (tree &&
      tableMetadata && tableMetadata.length > 0 &&
      projectMetadata?.fields &&
      projectMetadata?.fieldUniqueValues
    ) {
      if (Object.keys(colourSchemeMapping).length === 0) {
        projectMetadata.fields.filter((fi) => fi.canVisualise).forEach((fi) => {
          setColourSchemeMapping((oldScheme) => ({
            ...oldScheme,
            [fi.columnName]: 'spectral',
          }));
        });
      }
      const mappingData = mapMetadataToPhylocanvas(
        tableMetadata,
        projectMetadata.fields,
        projectMetadata.fieldUniqueValues,
        colourSchemeMapping,
      );
      setPhylocanvasMetadata(mappingData.result);
      setPhylocanvasLegends(mappingData.legends);
    }
  }, [
    tree,
    projectMetadata?.fields,
    projectMetadata?.fieldUniqueValues,
    colourSchemeMapping,
    tableMetadata,
  ]);

  // Get tree historical versions
  useEffect(() => {
    const fetchVersions = async () => {
      const versionsResponse = await getTreeVersions(Number(analysisId), token);
      if (versionsResponse.status === ResponseType.Success) {
        setVersions(versionsResponse.data);
      }
    };

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      fetchVersions();
    }
  }, [analysisId, token, tokenLoading]);

  // Set tree properties from metadata and selected fields
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
          let length = 0;
          if (blockValue.label) {
            if (typeof blockValue.label === 'string') {
              length = blockValue.label.length;
            } else if (blockValue.label instanceof Date) {
              length = isoDateLocalDateNoTime(blockValue.label.toISOString()).length;
            }
          }
          // check if the block has been seen before
          if (!(block in blockLengths)) {
            blockLengths[block] = length;
          } else if (length > blockLengths[block]) {
            blockLengths[block] = length;
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
              // Assume label is already a string
              const labelString = value[block].label.toString();

              return prefix + labelString.padEnd(blockLength, ' ');
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
      if (treeResponse.status === ResponseType.Success) {
        setTree(treeResponse.data);
        if (jobInstanceId === 'latest') {
          const currentPath = window.location.href;
          const newPath = currentPath.replace('latest', treeResponse.data.jobInstanceId);
          window.history.pushState(null, '', newPath);
        }
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

  const renderTable = () => {
    if (tree) {
      return (
        <TreeTable
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          displayFields={projectMetadata?.fields || []}
          tableMetadata={tableMetadata}
          metadataLoadingState={projectMetadata?.loadingState || MetadataLoadingState.IDLE}
          fieldLoadingState={projectMetadata?.fieldLoadingStates || {}}
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
    const availableFields = projectMetadata?.fields || [];
    const allColumns = availableFields.map(field => field.columnName);
    const visualisableColumns = availableFields.filter(
      (field) => field.canVisualise,
    ).map(field => field.columnName);
    const ids = treeSampleNames ?? [];

    const handleJumpToSubtree = (id: string) => {
      if (!tree) return;
      setRootId(id);
    };

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
                    border={1}
                    borderColor="#dddddd"
                  />
                  <Typography variant="caption">{label || 'null'}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      );
    }
    if (tree && (state.nodeColumn !== '' || state.blocks.length !== 0)) {
      return (
        <Stack direction="row">
          <Box sx={{ marginTop: '20px', paddingLeft: 2 }} ref={legRef} width="100%">
            {/* Only render node colour entry if not already in the legend  */}
            {(state.nodeColumn !== '' && !state.blocks.includes(state.nodeColumn)) && (
              <Stack direction="row" spacing={2} display="flex" alignContent="space-between" justifyContent="space-between">
                <div>
                  {generateLegend(state.nodeColumn)}
                </div>
                <ColorSchemeSelector
                  selectedScheme={colourSchemeMapping[state.nodeColumn]}
                  onColourChange={(newColor) => setColourSchemeMapping((oldScheme) => ({
                    ...oldScheme,
                    [state.nodeColumn]: newColor,
                  }))}
                />
              </Stack>
            )}
            {state.blocks.map((block) => (
              block !== '' && (
                <Stack direction="row" spacing={2} alignContent="space-between" justifyContent="space-between">
                  <div key={block}>
                    {generateLegend(block)}
                  </div>
                  <ColorSchemeSelector
                    selectedScheme={colourSchemeMapping[block]}
                    onColourChange={(newColor) => setColourSchemeMapping((oldScheme) => ({
                      ...oldScheme,
                      [block]: newColor,
                    }))}
                  />
                </Stack>
              )
            ))}
          </Box>
        </Stack>
      );
    }
    return null;
  };

  const renderWarning = () => {
    if (projectMetadata?.loadingState === MetadataLoadingState.ERROR ||
        projectMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      return (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          An error occured loading metadata; metadata may be missing or incomplete.
        </Alert>
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
        {renderWarning()}
        {renderTree()}
        {renderLegend()}
        {renderTable()}
      </Grid>
    </Grid>

  );
}
export default TreeDetail;
