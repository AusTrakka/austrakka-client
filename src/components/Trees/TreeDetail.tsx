/** biome-ignore-all lint/nursery/useDestructuring: not useful for this file */
import type React from 'react';
import { createRef, type SyntheticEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Grid,
  type SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { calculateUniqueValues } from '../../app/metadataSliceUtils';
import { TreeVersion } from '../../types/dtos';
import Tree, { TreeExportFuctions } from './Tree';
import { TreeTypes } from './PhylocanvasGL';
import MetadataControls from './TreeControls/Metadata';
import ExportButton from './TreeControls/Export';
import Search from './TreeControls/Search';
import NodeAndLabelControls from './TreeControls/NodeAndLabel';
import TreeNavigation from './TreeControls/TreeNavigation';
import TreeState from '../../types/tree.interface';
import ColorSchemeSelector from './TreeControls/SchemeSelector';
import { Theme } from '../../assets/themes/theme';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import {
  selectProjectMetadata, ProjectMetadataState,
} from '../../app/projectMetadataSlice';import type {
  FieldAndColourScheme,
  PhylocanvasLegends,
  PhylocanvasMetadata,
} from '../../types/phylocanvas.interface';
import type { Sample } from '../../types/sample.interface';
import { useAppSelector } from '../../app/store';
import { isoDateLocalDate, isoDateLocalDateNoTime } from '../../utilities/dateUtils';
import mapMetadataToPhylocanvas from '../../utilities/treeUtils';
import TreeSamplesTable from './TreeSamplesTable';
import { useStateFromSearchParamsForObject, useStateFromSearchParamsForPrimitive } from '../../utilities/stateUtils';
import { defaultDiscreteColorScheme } from '../../constants/schemes';
import { selectTreeById } from '../../app/treeSlice';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { LOCAL_PROJECT } from '../../constants/standaloneClientConstants';

// TODO need to inform user if CSV and tree don't match, and which way they don't match

// TODO remove the useless version selector widget from this version of the client

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
  labelBlocks: [SAMPLE_ID_FIELD],
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
  const { treeId } = useParams();
  const navigate = useNavigate();
  const treeRef = createRef<TreeExportFuctions>();
  const legRef = createRef<HTMLDivElement>();
  const [treeSampleNames, setTreeSampleNames] = useState<string[]>([]);
  const [tableMetadata, setTableMetadata] = useState<Sample[]>([]);
  const [phylocanvasMetadata, setPhylocanvasMetadata] = useState<PhylocanvasMetadata>({});
  const [phylocanvasLegends, setPhylocanvasLegends] = useState<PhylocanvasLegends>({});
  const [versions, setVersions] = useState<TreeVersion[]>([]);
  const [styles, setStyles] = useState<Record<string, Style>>({});
  const [colourSchemeMapping, setColourSchemeMapping] = useState<FieldAndColourScheme>({});
  const [state, setState] = useStateFromSearchParamsForObject(defaultState, navigate);
  const rootIdDefault: string = '0';
  const [rootId, setRootId] = useStateFromSearchParamsForPrimitive(
    'rootId',
    rootIdDefault,
    navigate,
  );
  const projectMetadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, LOCAL_PROJECT.abbreviation));
  const [tree, errorMsg] : [TreeVersion | null, string] =
    useAppSelector(state => selectTreeById(state, Number(treeId)));

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    // Get list of Seq_IDs from newick
    if (tree) {
      const matches = Array.from(tree.newickTree.matchAll(treenameRegex), (m) => m[1]);
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
      const filteredMetadata = projectMetadata.metadata.filter((row) =>
        treeSamplesSet.has(row.Seq_ID),
      );
      setTableMetadata(filteredMetadata);
    }
  }, [projectMetadata?.metadata, treeSampleNames]);

  // Map group tabular metadata to format for phylocanvas, including colour mappings
  useEffect(() => {
    if (tree && tableMetadata && tableMetadata.length > 0 && projectMetadata?.fields) {
      if (Object.keys(colourSchemeMapping).length === 0) {
        projectMetadata.fields
          .filter((fi) => fi.canVisualise)
          .forEach((fi) => {
            setColourSchemeMapping((oldScheme) => ({
              ...oldScheme,
              [fi.columnName]: defaultDiscreteColorScheme,
            }));
          });
      }

      const tableUniqueValues = calculateUniqueValues(
        projectMetadata.fields.map((f) => f.columnName),
        projectMetadata.fields,
        tableMetadata,
      );

      const mappingData = mapMetadataToPhylocanvas(
        tableMetadata,
        projectMetadata.fields,
        tableUniqueValues,
        colourSchemeMapping,
      );
      setPhylocanvasMetadata(mappingData.result);
      setPhylocanvasLegends(mappingData.legends);
    }
  }, [tree, projectMetadata?.fields, colourSchemeMapping, tableMetadata]);

  // Get tree historical versions
  useEffect(() => {
    // For now, empty
    setVersions([]);
  }, [treeId]);

  // Set tree properties from metadata and selected fields
  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    if (phylocanvasMetadata) {
      const newStyles: Record<string, Style> = {};
      const delimiter = '|';

      // Determine which leaf nodes are currently visible under the current rootId
      // Prefer using the Phylocanvas API exposed via the ref; fallback to all keys if unavailable
      const visibleLeafIDs: string[] =
        treeRef.current?.getVisibleLeafIDs?.() || Object.keys(phylocanvasMetadata);

      const visibleSet = new Set(visibleLeafIDs);

      // find the length of the longest label for each block, based only on visible leaves
      const blockLengths: Record<string, number> = {};
      blockLengths.id = 0;
      for (const [nodeId, value] of Object.entries(phylocanvasMetadata)) {
        if (!visibleSet.has(nodeId)) continue;
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

      // build styles only for visible leaves
      for (const [nodeId, value] of Object.entries(phylocanvasMetadata)) {
        if (!visibleSet.has(nodeId)) continue;
        const label = state.labelBlocks.map((block) => {
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
        });
        const formattedBlocksString = `${label.join(delimiter)}`;
        // If no labels were selected AND showLeafLabels is true, show the nodeId as the label
        if (formattedBlocksString.length === 0) {
          if (state.showLeafLabels) {
            newStyles[nodeId] = { label: nodeId };
          } else {
            newStyles[nodeId] = { label: '' };
          }
        } else {
          // formattedBlocksString has length > 0, don't force showing nodeId
          newStyles[nodeId] = { label: `${formattedBlocksString}` };
        }
        if (state.nodeColumn !== '') {
          newStyles[nodeId].fillColour = value[state.nodeColumn].colour;
        }
      }
      setStyles(newStyles);
    }
    // Don't include treeRef in deps:
  }, [
    state.labelBlocks,
    state.keyValueLabelBlocks,
    phylocanvasMetadata,
    state.alignLabels,
    state.showLeafLabels,
    rootId,
    state.nodeColumn,
  ]);
  
  const renderTree = () => {
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
          {...state}
        />
      );
    }
    return <></>;
  };

  const renderTable = () => {
    if (tree) {
      return (
        <TreeSamplesTable
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          displayFields={projectMetadata?.fields || []}
          uniqueValues={projectMetadata?.fieldUniqueValues ?? null}
          tableMetadata={tableMetadata}
          metadataLoadingState={projectMetadata?.loadingState || MetadataLoadingState.IDLE}
          fieldLoadingState={projectMetadata?.fieldLoadingStates || {}}
          emptyColumns={projectMetadata?.emptyColumns || []}
          treeName={tree.treeName}
        />
      );
    }
    return <></>;
  };

  const handleSearch = (_event: SyntheticEvent<Element, Event>, value: string[]) => {
    setSelectedIds(value);
  };

  const handleStateChange = (
    event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>,
  ) => {
    // Detect if the event is coming from a checkbox
    const isCheckbox = (event.target as HTMLInputElement).checked !== undefined;
    setState({
      ...state,
      [event.target.name]: isCheckbox
        ? (event.target as HTMLInputElement).checked
        : event.target.value,
    });
  };

  const renderControls = () => {
    const availableFields = projectMetadata?.fields || [];
    const allColumns = availableFields.map((field) => field.columnName);
    const visualisableColumns = availableFields
      .filter((field) => field.canVisualise)
      .map((field) => field.columnName);
    const ids = treeSampleNames ?? [];

    const handleJumpToSubtree = (id: string) => {
      if (!tree) return;
      setRootId(id);
    };

    if (tree) {
      return (
        <Grid item xs={3} sx={{ minWidth: '250px', maxWidth: '300px' }}>
          <Grid item sx={{ marginBottom: 1 }}>
            <Search options={ids} selectedIds={selectedIds} onChange={handleSearch} />
          </Grid>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
          <ExportButton treeName={tree.treeName} phylocanvasRef={treeRef} legendRef={legRef} />
        </Grid>
      );
    }
    return <></>;
  };

  const renderLegend = () => {
    function generateLegend(selectedColumn: string) {
      const legendValues = phylocanvasLegends[selectedColumn];
      if (!legendValues) {
        return null; // Handle the case where the selected column doesn't exist
      }

      return (
        <>
          <Typography variant="body2" fontWeight="bold">
            {selectedColumn}
          </Typography>
          <Grid container spacing={1} sx={{ marginBottom: '8px' }}>
            {Object.entries(legendValues).map(([label, color]) => (
              <Grid item key={label}>
                <Box display="flex" alignItems="center">
                  <Box
                    width="10px"
                    height="10px"
                    bgcolor={color}
                    marginRight="10px"
                    border={1}
                    borderColor={Theme.PrimaryGrey300}
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
        <Stack
          direction="column"
          spacing={6}
          alignContent="space-between"
          justifyContent="space-between"
        >
          <Box sx={{ marginTop: '20px', paddingLeft: 2 }} ref={legRef} width="100%">
            {/* Only render node colour entry if not already in the legend  */}
            {state.nodeColumn !== '' && !state.blocks.includes(state.nodeColumn) && (
              <Stack
                direction="row"
                spacing={2}
                display="flex"
                alignContent="space-between"
                justifyContent="space-between"
              >
                <div>{generateLegend(state.nodeColumn)}</div>
                <ColorSchemeSelector
                  selectedScheme={colourSchemeMapping[state.nodeColumn]}
                  onColourChange={(newColor) =>
                    setColourSchemeMapping((oldScheme) => ({
                      ...oldScheme,
                      [state.nodeColumn]: newColor,
                    }))
                  }
                  variant="standard"
                  size="medium"
                />
              </Stack>
            )}
            {state.blocks.map(
              (block) =>
                block !== '' && (
                  <Stack
                    direction="row"
                    spacing={2}
                    alignContent="space-between"
                    justifyContent="space-between"
                  >
                    <div key={block}>{generateLegend(block)}</div>
                    <ColorSchemeSelector
                      selectedScheme={colourSchemeMapping[block]}
                      onColourChange={(newColor) =>
                        setColourSchemeMapping((oldScheme) => ({
                          ...oldScheme,
                          [block]: newColor,
                        }))
                      }
                      variant="standard"
                      size="medium"
                    />
                  </Stack>
                ),
            )}
          </Box>
        </Stack>
      );
    }
    return null;
  };

  const renderWarning = () => {
    if (
      projectMetadata?.loadingState === MetadataLoadingState.ERROR ||
      projectMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
    ) {
      return (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          An error occured loading metadata; metadata may be missing or incomplete.
        </Alert>
      );
    }
    return <></>;
  };

  return (
    <Grid container wrap="nowrap" spacing={2}>
      {renderControls()}
      <Grid item xs={9} className="treeContainer">
        <Typography className="pageTitle">
          {tree
            ? `${tree.treeName} - ${isoDateLocalDate(tree.versionName.replaceAll('-', '/'))}`
            : ''}
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
