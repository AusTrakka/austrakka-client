import React, { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, Typography, CardMedia, Stack, CardActionArea, IconButton, Icon, CircularProgress, Tooltip, Grid } from '@mui/material';
import { MoveToInbox, InfoOutlined } from '@mui/icons-material';
import { ProFormaVersion } from '../../types/dtos';
import { isoDateLocalDate } from '../../utilities/dateUtils';

export enum CardType {
  Summary = 0,
  Details = 1,
  Reference = 2,
}

interface CardStyleConfig {
  cardBackground: string;
  textColor: string;
  showDownloadIcon: boolean;
  showLatestLabel: boolean;
  iconToShow: React.ReactNode | null;
}

function getCardStyleConfig(cardType: CardType): CardStyleConfig {
  switch (cardType) {
    case CardType.Summary:
      return {
        cardBackground: 'var(--primary-main)',
        textColor: 'white',
        showDownloadIcon: true,
        showLatestLabel: true,
        iconToShow: null,
      };
    case CardType.Details:
      return {
        cardBackground: 'white',
        textColor: 'black',
        showDownloadIcon: false,
        showLatestLabel: false,
        iconToShow: <Icon />,
      };
    case CardType.Reference:
      return {
        cardBackground: 'var(--secondary-light)', // Or '#f5f5f5' for soft contrast
        textColor: '#555', // Slightly muted for subtlety
        showDownloadIcon: false,
        showLatestLabel: false,
        iconToShow: (
          <Tooltip title="Reference template — no attached file" arrow>
            <InfoOutlined
              sx={{
                color: '#757575',
                cursor: 'help',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
        ),
      };
    default:
      return {
        cardBackground: 'white',
        textColor: 'black',
        showDownloadIcon: false,
        showLatestLabel: false,
        iconToShow: null,
      };
  }
}

function GenerateCards(
  versions: ProFormaVersion[],
  handleFileDownload: (dAbbrev: string, version: number | null) => Promise<void>,
  cardType: CardType,
  loadingState: number | null,
  setLoadingState: Dispatch<SetStateAction<number | null>>,
  handleRedirect: (version: ProFormaVersion) => void,
) {
  const styleConfig = getCardStyleConfig(cardType);

  const handleDownload = async (abbrev: string, id: number, version: number | null = null) => {
    try {
      setLoadingState(id); // Set loading state
      await handleFileDownload(abbrev, version);
    } finally {
      setTimeout(() => {
        setLoadingState(null); // Reset loading state
      }, 2000); // 2000 milliseconds = 2 seconds
    }
  };

  const renderIconButton = (version: ProFormaVersion) => {
    if (styleConfig.iconToShow) {
      return styleConfig.iconToShow;
    }

    if (loadingState === version.proFormaId) {
      return (
        <CircularProgress size={35} color="secondary" />
      );
    }

    if (styleConfig.showDownloadIcon) {
      return (
        <IconButton
          aria-label="download"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(
              version.abbreviation,
              version.proFormaId,
              !version.isCurrent ?
                version.version :
                undefined,
            );
          }}
          sx={{ padding: 0, pointerEvents: 'auto' }}
        >
          <MoveToInbox color="secondary" fontSize="large" />
        </IconButton>
      );
    }

    return null;
  };

  const renderInformationButton = (version: ProFormaVersion) => {
    if (!version.isCurrent && cardType === CardType.Summary) {
      return (
        <Tooltip title={`This is the latest template, but the definition in ${import.meta.env.VITE_BRANDING_NAME} has changed since this was uploaded`} sx={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <InfoOutlined
            sx={{ fontSize: '15px', padding: 0, marginLeft: '5px', color: 'white', pointerEvents: 'auto' }}
          />
        </Tooltip>
      );
    }
    return null;
  };

  const renderColumnFields = (item: any) => (
    <div
      key={item.metaDataColumnMappingId}
      className="column"
      style={{ maxWidth: '75px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: '1px' }}
    >
      <Typography noWrap sx={{ fontSize: '13px' }}>
        {item.metaDataColumnName}
      </Typography>
    </div>
  );

  return versions.map((version) => (
    <Card
      key={version.proFormaVersionId}
      style={{
        backgroundColor: styleConfig.cardBackground,
        width: '280px',
        height: '250px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: cardType === CardType.Reference ? '1px dashed #ccc' : 'none',
      }}
    >
      <CardActionArea
        onClick={() => handleRedirect(version)}
        sx={{ pointerEvents: 'auto',
          borderBottom: 1,
          borderColor: 'var(--secondary-light-grey)',
          cursor: 'zoom-in' }}
      >
        <CardMedia
          component="div"
          style={{
            backgroundColor: 'white',
            height: '150px', // Set a fixed height for the media
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h5" padding={0.5}> Fields</Typography>
          <Grid
            container
            justifyContent="space-between"
            sx={{ padding: 1,
              alignContent: 'center',
              height: '70px',
              justifyContent: 'space-evenly' }}
          >
            <Stack>
              {version.columnMappings
                .slice(0, 3)
                .map((item) => (
                  renderColumnFields(item)))}
            </Stack>
            <Stack minWidth="75px">
              {version.columnMappings
                .slice(3, 6)
                .map((item) => renderColumnFields(item))}
            </Stack>
          </Grid>
          <Typography color="var(--primary-grey-400)" variant="button" padding={1}>
            DETAILS
          </Typography>
        </CardMedia>
      </CardActionArea>
      <CardContent style={{ borderTop: 1, borderColor: 'black', pointerEvents: 'none' }}>
        <Stack direction="row" justifyContent="space-between">
          <Stack sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>
            <Typography
              title={version.assetId ? version.originalFileName : 'Template'}
              noWrap
              gutterBottom
              variant="h5"
              component="div"
              style={{ color: styleConfig.textColor, alignContent: 'end', pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {version.assetId ? version.originalFileName : 'Template'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              style={{ color: styleConfig.textColor,
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
          <Stack alignItems="flex-end" spacing={2} justifyContent="space-between">
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
                style={{ color: styleConfig.textColor }}
              >
                {styleConfig.showLatestLabel && version.assetId ? 'Latest' : ''}
              </Typography>
              {renderInformationButton(version)}
            </div>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  ));
}

export default GenerateCards;
