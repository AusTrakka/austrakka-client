import React, { memo, useState } from 'react';
import { Card, CardContent, Typography, Grid, CardMedia, Box, Paper, Accordion, styled, AccordionSummary, AccordionDetails, Icon, IconButton, Stack, CardActionArea, Dialog, DialogTitle, Table, TableContainer, TableBody, TableRow, TableCell, TableHead, DialogContent } from '@mui/material';
import { ExpandMore, MoveToInbox } from '@mui/icons-material';
import Masonry from '@mui/lab/Masonry';
import isoDateLocalDate from '../../utilities/helperUtils';
import { ProFormaVersion, MetaDataColumnMapping } from '../../types/dtos';
import { getProFormaDownload } from '../../utilities/resourceUtils';

interface ProFormasProps {
  isProFormasLoading: boolean,
  proformaList: ProFormaVersion[],
}

interface SimpleDialogProps {
  open: boolean;
  proformaDialog: MetaDataColumnMapping[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>; // Add this
  setProFormaDialog: React.Dispatch<React.SetStateAction<MetaDataColumnMapping[]>>; // Add this
}

function generateCards(
  versions: ProFormaVersion[],
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setProFormaDialog: React.Dispatch<React.SetStateAction<MetaDataColumnMapping[]>>,
) {
  const handleClickOpen = (dinfo: MetaDataColumnMapping[]) => {
    setOpen(true);
    setProFormaDialog(dinfo);
  };

  const handleFileDownload = async (dAbbrev: string) => {
    try {
      const { blob, suggestedFilename } = await getProFormaDownload(dAbbrev);

      // Create a URL for the Blob object
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = suggestedFilename;
      link.click();

      // Clean up the URL and remove the link
      URL.revokeObjectURL(blobUrl);
      link.remove();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error:', error);
    }
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
      <CardActionArea onClick={() => handleClickOpen(version.columnMappings)} sx={{ pointerEvents: 'auto', borderBottom: 1, borderColor: '#B3B3B3' }}>
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
          <Grid container justifyContent="space-between" sx={{ padding: 3, alignContent: 'center', height: '120px', justifyContent: 'space-evenly' }}>
            <Stack>
              {version.columnMappings
                .slice(0, 3)
                .map((item, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} className="column" style={{ maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', padding: '3px' }}>
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
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} className="column" style={{ maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', padding: '3px' }}>
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
            >
              {version.originalFileName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              style={{ color: version.isCurrent ? 'white' : 'black', textAlign: 'left', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {version.createdBy}
              <br />
              {isoDateLocalDate(version.created.toString())}
            </Typography>
          </Stack>
          <Stack alignItems="flex-end" spacing={2} justifyContent="space-between">
            {version.isCurrent ? (
              <IconButton aria-label="download" disabled={!version.isCurrent} onClick={(e) => { e.stopPropagation(); handleFileDownload(version.abbreviation); }} sx={{ padding: 0, pointerEvents: 'auto' }}>
                <MoveToInbox color="secondary" fontSize="large" />
              </IconButton>
            )
              : <Icon />}
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

function SimpleDialog(props: SimpleDialogProps) {
  const { open, proformaDialog, setOpen, setProFormaDialog } = props;

  const handleClose = () => {
    setProFormaDialog([]); // Clear the dialog data when closing
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: '#OA3546', fontWeight: 'bold', paddingLeft: '40px' }}>ProForma Information</DialogTitle>
      <DialogContent sx={{ padding: '40px' }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  style={{ backgroundColor: '#90ca6d', fontWeight: 'bold' }}
                >
                  Name
                </TableCell>
                <TableCell
                  align="right"
                  style={{ backgroundColor: '#90ca6d', fontWeight: 'bold' }}
                >
                  Required
                </TableCell>
                <TableCell
                  align="right"
                  style={{ backgroundColor: '#90ca6d', fontWeight: 'bold' }}
                >
                  Type
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proformaDialog.map((row) => (
                <TableRow key={row.id}>
                  <TableCell component="th" scope="row">
                    {row.metaDataColumnName}
                  </TableCell>
                  <TableCell align="right">{row.isRequired.toString()}</TableCell>
                  <TableCell align="right">{row.metaDataColumnPrimitiveType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProFormaList(props: ProFormasProps) {
  const { isProFormasLoading,
    proformaList } = props;

  const [open, setOpen] = useState(false);
  const [profromaDialog, setProFormaDialog] = useState<MetaDataColumnMapping[]>([]);

  // eslint-disable-next-line max-len
  const groupedObjects: { [group: string]: ProFormaVersion[] } = proformaList.reduce((acc, obj) => {
    const group = obj.abbreviation;
    const result = { ...acc };

    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(obj);
    return result;
  }, {} as { [group: string]: ProFormaVersion[] });

  // Sorting function
  const sortByCreated = (a: ProFormaVersion, b: ProFormaVersion) => {
    if (a.created > b.created) {
      return -1;
    } if (a.created < b.created) {
      return 1;
    }
    return 0;
  };

  // Iterate over each group
  Object.keys(groupedObjects).forEach(group => {
  // Sort the array of objects within each group
    groupedObjects[group].sort(sortByCreated);
  });

  const StyledAccordion = styled(Accordion)(({ theme }) => ({
    backgroundColor: '#eef2f6',
    color: theme.palette.text.secondary,
    flexDirection: 'column',
  }));

  return (
    <>
      {isProFormasLoading}
      <Box sx={{ }}>
        <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
          {Object.keys(groupedObjects).map((index) => (
            <Paper key={groupedObjects[index][0].proformaId} sx={{ minWidth: '400px', minHeight: '372px', backgroundColor: '#eef2f6' }}>
              <StyledAccordion sx={{ pointerEvents: 'none' }}>
                <AccordionSummary
                  sx={{ flexDirection: 'column' }}
                  expandIcon={groupedObjects[index].length === 1
                    ?
                      <Icon />
                    :
                      <ExpandMore sx={{ pointerEvents: 'auto' }} />}
                >
                  <Box sx={{ flexDirection: 'column' }}>
                    <Typography variant="h4" sx={{ padding: '10px' }}>
                      {groupedObjects[index][0].abbreviation}
                    </Typography>
                    {groupedObjects[index] && // Check if groupedObjects[index] is defined
                    generateCards(
                      groupedObjects[index].filter(pv => pv.isCurrent),
                      setOpen,
                      setProFormaDialog,
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ flexDirection: 'column', paddingLeft: '35px', paddingBottom: 5, paddingTop: 3 }}>
                  <Stack spacing={3} sx={{ justifyContent: 'space-evenly' }}>
                    {generateCards(
                      groupedObjects[index].filter(pv => !pv.isCurrent),
                      setOpen,
                      setProFormaDialog,
                    )}
                  </Stack>
                </AccordionDetails>
              </StyledAccordion>
            </Paper>
          ))}
        </Masonry>
      </Box>
      <SimpleDialog
        proformaDialog={profromaDialog}
        open={open}
        setOpen={setOpen}
        setProFormaDialog={setProFormaDialog}
      />
    </>
  );
}

export default memo(ProFormaList);
