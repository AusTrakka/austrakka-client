import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import { JobInstance } from '../../types/dtos';
import { ResponseObject, getTreeData } from '../../utilities/resourceUtils';
import Tree from './Tree';

function TreeDetail() {
  const { analysisId } = useParams();
  const [tree, setTree] = useState<JobInstance | null>();
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          resizeWidthTo=".pagePadded" // auto-resize width to container
          size={{ width: 1000, height: 600 }}
          showLabels
          showLeafLabels
          interactive
        />
      );
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  };

  return (
    <>
      <Typography className="pageTitle">
        {tree ? tree.analysisName : ''}
      </Typography>
      {renderTree()}
    </>
  );
}

export default TreeDetail;
