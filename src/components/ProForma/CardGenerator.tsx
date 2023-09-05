import React, { Dispatch, SetStateAction, useState } from 'react';
import { Card, CardContent, Typography, CardMedia, Grid, Stack, CardActionArea, IconButton, Icon, CircularProgress, Tooltip } from '@mui/material';
import { MoveToInbox, InfoOutlined } from '@mui/icons-material';
import isoDateLocalDate from '../../utilities/helperUtils';
import { ProFormaVersion, MetaDataColumnMapping } from '../../types/dtos';

function GenerateCards(
  versions: ProFormaVersion[],
  setOpen: Dispatch<React.SetStateAction<boolean>>,
  setProFormaDialog: Dispatch<SetStateAction<MetaDataColumnMapping[]>>,
  setProFormaAbbrev: Dispatch<SetStateAction<string>>,
  handleFileDownload: (dAbbrev: string, id : number | null) => Promise<void>,
  main: boolean,
) {
  const handleClickOpen = (dinfo: MetaDataColumnMapping[], abbrev: string) => {
    setOpen(true);
    setProFormaDialog(dinfo);
    setProFormaAbbrev(abbrev);
  };

  const [loadingState, setLoadingState] = useState<boolean>(false);

  const handleDownload = async (abbrev: string, id:number | null = null) => {
    try {
      setLoadingState(true); // Set loading state
      await handleFileDownload(abbrev, id);
    } finally {
      setTimeout(() => {
        setLoadingState(false); // Reset loading state
      }, 2000); // 2000 milliseconds = 2 seconds
    }
  };

  const renderIconButton = (version : ProFormaVersion) => {
    if (!main) {
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
        onClick={(e) => {
          e.stopPropagation();
          handleDownload(version.abbreviation, !version.isCurrent ? version.version : undefined);
        }}
        sx={{ padding: 0, pointerEvents: 'auto' }}
      >
        <MoveToInbox color="secondary" fontSize="large" />
      </IconButton>
    );
  };

  const informationButton = (version: ProFormaVersion) => {
    if (version.isCurrent === false && versions.length === 1 && main) {
      return (
        <span>
          <Tooltip title="This is the latest template, but the definition in AusTrakka has changed since this was uploaded" sx={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <InfoOutlined
              sx={{ fontSize: '15px', padding: 0, marginLeft: '5px', color: 'white', pointerEvents: 'auto' }}
            />
          </Tooltip>
        </span>
      );
    }
    return null;
  };

  return versions.map((version) => (
    <Card
      key={version.proFormaVersionId}
      style={{
        backgroundColor: main ? '#0A3546' : 'white',
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
          borderColor: '#B3B3B3',
          cursor: 'zoom-in' }}
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
            sx={{ padding: 2,
              alignContent: 'center',
              height: '120px',
              justifyContent: 'space-evenly' }}
          >
            <Stack>
              {version.columnMappings
                .slice(0, 3)
                .map((item, i) => (
                  <div
                    key={version.columnMappings[i].metaDataColumnMappingId}
                    className="column"
                    style={{ maxWidth: '125px',
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
            <Stack>
              {version.columnMappings
                .slice(3, 6)
                .map((item, i) => (
                  <div
                    key={version.columnMappings[i].metaDataColumnMappingId}
                    className="column"
                    style={{ maxWidth: '125px',
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

          </Grid>
          <Typography color="secondary" justifySelf="center">
            EXPAND
          </Typography>
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
              style={{ color: main ? 'white' : 'black', alignContent: 'end', pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {version.originalFileName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              style={{ color: main ? 'white' : 'black',
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
            <div style={{
              display: 'inline-flex',
              verticalAlign: 'text-bottom',
              boxSizing: 'inherit',
              textAlign: 'center',
              alignItems: 'center',
            }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                style={{ color: main ? 'white' : 'black' }}
              >
                {main ? 'Latest' : ''}
              </Typography>
              {informationButton(version)}
            </div>
          </Stack>
        </Grid>
      </CardContent>
    </Card>
  ));
}

export default GenerateCards;
