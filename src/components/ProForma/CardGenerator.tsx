import React, { Dispatch, SetStateAction } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CardMedia,
  Stack,
  CardActionArea,
  IconButton,
  Icon,
  CircularProgress,
  Tooltip,
  Grid, // need to import Grid2 for the future.
} from '@mui/material';
import { MoveToInbox, InfoOutlined } from '@mui/icons-material';
import { ProFormaVersion } from '../../types/dtos';
import { isoDateLocalDate } from '../../utilities/dateUtils';

const {
  VITE_THEME_SECONDARY_BLUE,
  VITE_THEME_SECONDARY_TEAL,
  VITE_BRANDING_NAME,
  VITE_THEME_PRIMARY_MAIN,
  VITE_THEME_PRIMARY_GREY,
  VITE_THEME_PRIMARY_GREY_600,
  VITE_THEME_BACKGROUND,
  VITE_THEME_SECONDARY_DARK_GREY,
  VITE_THEME_SECONDARY_LIGHT_GREY,
  VITE_THEME_PRIMARY_GREY_400,
} = import.meta.env;

export enum CardType {
  CurrentWithFile = 0,
  Historical = 1,
  CurrentWithoutFile = 2,
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
    case CardType.CurrentWithFile:
      return {
        cardBackground: VITE_THEME_PRIMARY_MAIN,
        textColor: VITE_THEME_PRIMARY_GREY,
        showDownloadIcon: true,
        showLatestLabel: true,
        iconToShow: null,
      };
    case CardType.Historical:
      return {
        cardBackground: VITE_THEME_BACKGROUND,
        textColor: VITE_THEME_SECONDARY_DARK_GREY,
        showDownloadIcon: false,
        showLatestLabel: false,
        iconToShow: <Icon />,
      };
    case CardType.CurrentWithoutFile:
      return {
        cardBackground: VITE_THEME_PRIMARY_GREY,
        textColor: VITE_THEME_PRIMARY_GREY_600, // Slightly muted for subtlety
        showDownloadIcon: false,
        showLatestLabel: false,
        iconToShow: (
          <Tooltip title="Reference template — no attached file" arrow>
            <InfoOutlined
              sx={{
                color: VITE_THEME_SECONDARY_BLUE,
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
        cardBackground: VITE_THEME_BACKGROUND,
        textColor: VITE_THEME_SECONDARY_DARK_GREY,
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
    if (!version.isCurrent && cardType === CardType.CurrentWithFile) {
      return (
        <Tooltip
          title={`This is the latest template, but the definition in ${VITE_BRANDING_NAME}
         has changed since this was uploaded`}
          sx={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
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
        border: cardType === CardType.CurrentWithoutFile ? `1px dashed ${VITE_THEME_SECONDARY_TEAL}` : 'none',
      }}
    >
      <CardActionArea
        onClick={() => handleRedirect(version)}
        sx={{ pointerEvents: 'auto',
          borderBottom: 1,
          borderColor: VITE_THEME_SECONDARY_LIGHT_GREY,
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
          <Typography color={VITE_THEME_PRIMARY_GREY_400} variant="button" padding={1}>
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
