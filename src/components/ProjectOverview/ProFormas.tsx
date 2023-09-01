/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { Typography, Box, Paper, Accordion, styled,
  AccordionSummary, AccordionDetails, Icon, Stack, Alert } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Masonry from '@mui/lab/Masonry';
import { ProFormaVersion, MetaDataColumnMapping } from '../../types/dtos';
import SimpleDialog from '../ProForma/TableDialog';
import GenerateCards from '../ProForma/CardGenerator';
import { getProFormaDownload } from '../../utilities/resourceUtils';

// Local Proforma Props
interface ProFormasListProps {
  isProFormasLoading: boolean,
  proformaList: ProFormaVersion[],
  proformaError: boolean,
  proFormaErrorMessage: string,
}

function ProFormaList(props: ProFormasListProps) {
  const { isProFormasLoading,
    proformaList,
    proFormaErrorMessage,
    proformaError } = props;

  const [open, setOpen] = useState(false);
  const [profromaDialog, setProFormaDialog] = useState<MetaDataColumnMapping[]>([]);
  const [proformaAbbrev, setProFormaAbbrev] = useState<string>('');

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
      { proformaError
        ? <Alert severity="error">{proFormaErrorMessage}</Alert>
        : (
          <Typography sx={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 2 }} variant="subtitle1" color="primary">
            This page holds ProFormas with attached
            templates. Only
            {' '}
            <b>current</b>
            {' '}
            ProForma templates may be downloaded.
          </Typography>
        )}
      { proformaList.length === 0 && !proformaError
        ? <Alert severity="warning">No attached templates for the ProFormas are available</Alert>
        : <br /> }
      <Box>
        <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
          {Object.keys(groupedObjects).map((index) => (
            <Paper
              key={groupedObjects[index][0].proFormaId}
              sx={{ minWidth: '400px',
                maxWidth: '400px',
                minHeight: '372px',
                backgroundColor: '#eef2f6' }}
            >
              <StyledAccordion sx={{ pointerEvents: 'none', margin: '0px' }}>
                <AccordionSummary
                  sx={{ flexDirection: 'column', margin: 0 }}
                  expandIcon={groupedObjects[index].length === 1
                    ?
                      <Icon />
                    :
                      <ExpandMore sx={{ pointerEvents: 'auto' }} />}
                >
                  <Box sx={{ flexDirection: 'column', margin: '0px' }}>
                    <Typography variant="h4" sx={{ padding: '10px' }}>
                      {groupedObjects[index][0].abbreviation}
                    </Typography>
                    {groupedObjects[index] && // Check if groupedObjects[index] is defined
                    GenerateCards(
                      groupedObjects[index].filter(pv => pv.isCurrent),
                      setOpen,
                      setProFormaDialog,
                      setProFormaAbbrev,
                      handleFileDownload,
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ flexDirection: 'column',
                  paddingLeft: '35px',
                  paddingBottom: 5,
                  paddingTop: 3 }}
                >
                  <Stack spacing={3} sx={{ justifyContent: 'space-evenly' }}>
                    <Typography variant="overline" sx={{}}>
                      Previous Versions
                    </Typography>
                    {GenerateCards(
                      groupedObjects[index].filter(pv => !pv.isCurrent),
                      setOpen,
                      setProFormaDialog,
                      setProFormaAbbrev,
                      handleFileDownload,
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
        proformaTitle={proformaAbbrev}
      />
    </>
  );
}

export default ProFormaList;
