import React, { Dispatch, SetStateAction, useState } from 'react';
import { Card, CardContent, Typography, CardMedia, Grid, Stack, CardActionArea, IconButton, Icon, CircularProgress } from '@mui/material';
import { MoveToInbox } from '@mui/icons-material';
import isoDateLocalDate from '../../utilities/helperUtils';
import { ProFormaVersion, MetaDataColumnMapping } from '../../types/dtos';

function GenerateCards(
  versions: ProFormaVersion[],
  setOpen: Dispatch<React.SetStateAction<boolean>>,
  setProFormaDialog: Dispatch<SetStateAction<MetaDataColumnMapping[]>>,
  setProFormaAbbrev: Dispatch<SetStateAction<string>>,
  handleFileDownload: (dAbbrev: string) => Promise<void>,
) {
  const handleClickOpen = (dinfo: MetaDataColumnMapping[], abbrev: string) => {
    setOpen(true);
    setProFormaDialog(dinfo);
    setProFormaAbbrev(abbrev);
  };

  const [loadingState, setLoadingState] = useState<boolean>(false);

  const handleDownload = async (abbrev: string) => {
    try {
      setLoadingState(true); // Set loading state
      await handleFileDownload(abbrev);
    } finally {
      setTimeout(() => {
        setLoadingState(false); // Reset loading state
      }, 2000); // 2000 milliseconds = 2 seconds
    }
  };

  const renderIconButton = (version : ProFormaVersion) => {
    if (!version.isCurrent) {
      return <Icon />;
    }

    if (loadingState) {
      return (
        <CircularProgress size={35} color="secondary" />
      );
    }

    return (
      <IconButton
        aria-label="download"
        disabled={!version.isCurrent}
        onClick={(e) => {
          e.stopPropagation();
          handleDownload(version.abbreviation);
        }}
        sx={{ padding: 0, pointerEvents: 'auto' }}
      >
        <MoveToInbox color="secondary" fontSize="large" />
      </IconButton>
    );
  };

  return versions.map((version) => (
    <Card
      key={version.proformaVersionId}
      style={{
        backgroundColor: version.isCurrent ? '#0A3546' : 'white',
        width: '330px', // Set a fixed width
        height: '300px', // Set a fixed height
        display: 'flex', // Use flex to control layout
        flexDirection: 'column', // Arrange content vertically
        justifyContent: 'space-between', // Spread content evenly
      }}
    >
      <CardActionArea
        onClick={() => handleClickOpen(version.columnMappings, version.abbreviation)}
        sx={{ pointerEvents: 'auto',
          borderBottom: 1,
          borderColor: '#B3B3B3' }}
      >
        <CardMedia
          component="div"
          style={{
            backgroundColor: 'white',
            height: '200px', // Set a fixed height for the media
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h5">Fields</Typography>
          <Grid
            container
            justifyContent="space-between"
            sx={{ padding: 3,
              alignContent: 'center',
              height: '120px',
              justifyContent: 'space-evenly' }}
          >
            <Stack>
              {version.columnMappings
                .slice(0, 3)
                .map((item, i) => (
                  <div
                    key={version.columnMappings[i].id}
                    className="column"
                    style={{ maxWidth: '90%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '3px' }}
                  >
                    <Typography noWrap>
                      {item.metaDataColumnName}
                    </Typography>
                  </div>
                ))}
            </Stack>
            <Stack spacing="space-between">
              {version.columnMappings
                .slice(3, 5)
                .map((item, i) => (
                  <div
                    key={version.columnMappings[i].id}
                    className="column"
                    style={{ maxWidth: '90%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '3px' }}
                  >
                    <Typography noWrap>
                      {item.metaDataColumnName}
                    </Typography>
                  </div>
                ))}
              <div style={{ maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', padding: '3px' }}>
                <Typography color="#A81E2C">More...</Typography>
              </div>
            </Stack>
          </Grid>
        </CardMedia>
      </CardActionArea>
      <CardContent style={{ borderTop: 1, borderColor: 'black', pointerEvents: 'none' }}>
        <Grid container sx={{ alignContent: 'center', justifyContent: 'space-between' }}>
          <Stack sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>
            <Typography
              title={version.originalFileName}
              noWrap
              gutterBottom
              variant="h5"
              component="div"
              style={{ color: version.isCurrent ? 'white' : 'black', alignContent: 'end', pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {version.originalFileName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              style={{ color: version.isCurrent ? 'white' : 'black',
                textAlign: 'left',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap' }}
            >
              {version.createdBy}
              <br />
              {isoDateLocalDate(version.created.toString())}
            </Typography>
          </Stack>
          <Stack alignItems="flex-end" spacing={2} justifyContent="space-evenly">
            {renderIconButton(version)}
            <Typography
              variant="caption"
              color="text.secondary"
              style={{ color: version.isCurrent ? 'white' : 'black' }}
            >
              {version.isCurrent ? 'Latest' : ''}
            </Typography>
          </Stack>
        </Grid>
      </CardContent>
    </Card>
  ));
}

export default GenerateCards;
