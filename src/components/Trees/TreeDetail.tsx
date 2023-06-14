import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Grid, Typography } from '@mui/material';
import { JobInstance, AnalysisResultMetadata } from '../../types/dtos';
import { DisplayFields } from '../../types/fields.interface';
import { ResponseObject, getTreeData, getTreeMetaData, getGroupDisplayFields } from '../../utilities/resourceUtils';
import Tree from './Tree';
import { TreeMetadata } from './PhylocanvasGL';
import MetadataColumnSelect from './TreeControls/Metadata';

function TreeDetail() {
  const { analysisId } = useParams();
  const [tree, setTree] = useState<JobInstance | null>();
  const [treeMetadata, setTreeMetadata] = useState<TreeMetadata>({});
  const [displayFields, setDisplayFields] = useState<DisplayFields[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // control hooks
  const [blocks, setBlocks] = useState<string[]>([]);

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
          source={tree.newickTree}
          resizeWidthTo=".treeContainer" // auto-resize width to container
          size={{ width: 600, height: 600 }}
          showLabels
          showLeafLabels={false}
          interactive
          metadata={treeMetadata}
          blocks={blocks}
          alignLabels
          showBlockHeaders
          nodeSize={4}
        />
      );
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  };

  const renderControls = () => {
    const visualisableColumns = displayFields.filter(
      (field) => field.canVisualise,
    ).map(field => field.columnName);

    if (tree) {
      return (
        <Grid item xs={2} sx={{ minWidth: '350px' }}>
          <div>
            Controls
            <MetadataColumnSelect
              columns={visualisableColumns}
              onChange={setBlocks}
            />
          </div>
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
