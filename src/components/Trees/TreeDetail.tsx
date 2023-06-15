import React, { SyntheticEvent, createRef, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { JobInstance, AnalysisResultMetadata } from '../../types/dtos';
import { DisplayFields } from '../../types/fields.interface';
import { ResponseObject, getTreeData, getTreeMetaData, getGroupDisplayFields } from '../../utilities/resourceUtils';
import Tree, { TreeExportFuctions } from './Tree';
import { TreeMetadata, TreeTypes } from './PhylocanvasGL';
import MetadataControls from './TreeControls/Metadata';
import ExportButton from './TreeControls/Export';
import Search from './TreeControls/Search';
import NodeAndLabelControls from './TreeControls/NodeAndLabel';

function TreeDetail() {
  const { analysisId } = useParams();
  const [tree, setTree] = useState<JobInstance | null>();
  const treeRef = createRef<TreeExportFuctions>();
  const [treeMetadata, setTreeMetadata] = useState<TreeMetadata>({});
  const [displayFields, setDisplayFields] = useState<DisplayFields[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // control hooks
  const [state, setState] = useState({
    blocks: [],
    alignLabels: true,
    showBlockHeaders: true,
    blockHeaderFontSize: 13,
    blockPadding: 3,
    blockSize: 16,
    showLeafLabels: false,
    fontSize: 16,
    nodeSize: 6,
    type: TreeTypes.Rectangular,
    showInternalLabels: false,
    showBranchLengths: false,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const mapData = useCallback(
    (dataArray: AnalysisResultMetadata[]) => {
      let colorIndex = 0;
      const valueColorMap: Record<string, string> = {};

      function getUniqueColor(value: string): string {
        // Check if value was already mapped to a color
        if (valueColorMap[value]) {
          return valueColorMap[value];
        }

        // Generate a unique color (here we use HSL colors for simplicity)
        const color = `hsl(${(colorIndex * 15) % 360}, 100%, 50%)`;

        // Increment the color index and store the color mapping
        colorIndex += 1;
        valueColorMap[value] = color;

        return color;
      }

      const result: TreeMetadata = {};
      for (const data of dataArray) {
        result[data.sampleId] = {};
        for (const metadataValue of data.metadataValues) {
          result[data.sampleId][metadataValue.key] = {
            colour: getUniqueColor(metadataValue.value),
            label: metadataValue.value,
          };
        }
      }
      return result;
    },
    [],
  );

  useEffect(() => {
    const getMetadata = async () => {
      const metadataResponse: ResponseObject = await getTreeMetaData(
        Number(analysisId),
        Number(tree?.jobInstanceId),
      );
      if (metadataResponse.status === 'Success') {
        setTreeMetadata(mapData(metadataResponse.data));
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
    if (tree) {
      getMetadata();
      getDisplayFields();
    }
  }, [analysisId, mapData, tree]);

  useEffect(() => {
    // Get tree details, including tree type
    const getTree = async () => {
      const treeResponse: ResponseObject = await getTreeData(Number(analysisId));
      if (treeResponse.status === 'Success') {
        setTree(treeResponse.data);
      } else {
        setErrorMsg(`Tree ${analysisId} could not be loaded`);
      }
      setIsTreeLoading(false);
    };

    getTree();
  }, [analysisId]);

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
          metadata={treeMetadata}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
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
    const ids = Object.keys(treeMetadata);

    if (tree) {
      return (
        <Grid item xs={3} sx={{ minWidth: '250px', maxWidth: '300px' }}>
          {/* <Typography>Controls</Typography> */}
          <Search
            options={ids}
            selectedIds={selectedIds}
            onChange={handleSearch}
          />
          <FormControl sx={{ marginY: 1 }} size="small" fullWidth>
            <InputLabel id="tree-type-label">Type</InputLabel>
            <Select
              labelId="tree-type-label"
              id="tree-type"
              value={[state.type]}
              name="type"
              label="Type"
              onChange={handleStateChange}
            >
              {
                  Object.keys(TreeTypes).map((type) => (
                    <MenuItem key={type} value={TreeTypes[type]}>{type}</MenuItem>
                  ))
                }
            </Select>
          </FormControl>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>Nodes & labels</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <NodeAndLabelControls
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
          {tree ? tree.analysisName : ''}
        </Typography>
        {renderTree()}
      </Grid>
    </Grid>

  );
}

export default TreeDetail;
