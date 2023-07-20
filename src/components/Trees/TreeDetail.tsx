import React, { SyntheticEvent, createRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import isoDateLocalDate from '../../utilities/helperUtils';

function TreeDetail() {
  const { analysisId, jobInstanceId } = useParams();
  const [tree, setTree] = useState<JobInstance | null>();
  const treeRef = createRef<TreeExportFuctions>();
  const [phylocanvasMetadata, setPhylocanvasMetadata] = useState<PhylocanvasMetadata>({});
  const [displayFields, setDisplayFields] = useState<DisplayFields[]>([]);
  const [versions, setVersions] = useState<JobInstance[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rootId, setRootId] = useState<string | null>(null);
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

  const handleJumpToSubtree = (subtreeRootId: string | null) => {
    setRootId(subtreeRootId);
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
          {tree ? `${tree.analysisName} - ${isoDateLocalDate(tree.versionName.replaceAll('-', '/'))}` : ''}
        </Typography>
        {renderTree()}
      </Grid>
    </Grid>

  );
}

export default TreeDetail;
