/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { Typography, Box, Paper, Accordion, styled,
  AccordionSummary, AccordionDetails, Icon, Stack, Alert } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Masonry from '@mui/lab/Masonry';
import { ProFormaVersion, MetaDataColumnMapping } from '../../types/dtos';
import SimpleDialog from '../ProForma/TableDialog';
import GenerateCards, { CardType } from '../ProForma/CardGenerator';
import { handleProformaDownload } from '../ProForma/proformaUtils';
import { useApi } from '../../app/ApiContext';

// Local Proforma Props
interface ProFormasListProps {
  proformaList: ProFormaVersion[],
  proformaError: boolean,
  proFormaErrorMessage: string,
  isProformasLoading: boolean,
}

function ProFormaList(props: ProFormasListProps) {
  const { proformaList,
    proFormaErrorMessage,
    proformaError,
    isProformasLoading } = props;

  const [open, setOpen] = useState(false);
  const [profromaDialog, setProFormaDialog] = useState<MetaDataColumnMapping[]>([]);
  const [proformaAbbrev, setProFormaAbbrev] = useState<string>('');
  const { token } = useApi();

  // Used by GenerateCards
  const [loadingState, setLoadingState] = useState<boolean>(false);

  const handleFileDownload = async (dAbbrev: string, version : number | null) => {
    handleProformaDownload(dAbbrev, version, token);
  };

  const sortByCreated = (a: ProFormaVersion, b: ProFormaVersion) => {
    if (a.created > b.created) {
      return -1;
    } if (a.created < b.created) {
      return 1;
    }
    return 0;
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

  // Iterate over each group
  Object.keys(groupedObjects).forEach(group => {
    // Sort the array of objects within each group
    groupedObjects[group].sort(sortByCreated);
  });

  // Sorting function
  const StyledAccordion = styled(Accordion)(({ theme }) => ({
    backgroundColor: '#eef2f6',
    color: theme.palette.text.secondary,
    flexDirection: 'column',
  }));

  const renderTitleOrError = (hasError: boolean, errMsg: string) => (hasError === true
    ? <Alert severity="error">{errMsg}</Alert>
    : (
      <Typography sx={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 2 }} variant="subtitle1" color="primary">
        This page holds pro formas with attached
        templates. Only
        {' '}
        <b>current</b>
        {' '}
        pro forma templates may be downloaded.
      </Typography>
    ));

  const renderEmptyState = (isEmpty: boolean, hasError: boolean) => (
    isEmpty && !hasError
      ? <Alert severity="warning">No attached templates for project pro formas are available</Alert>
      : <br />);

  const renderContent = () => (
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
                      groupedObjects[index].slice(0, 1),
                      setOpen,
                      setProFormaDialog,
                      setProFormaAbbrev,
                      handleFileDownload,
                      CardType.Summary,
                      loadingState,
                      setLoadingState,
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
                    groupedObjects[index].slice(1),
                    setOpen,
                    setProFormaDialog,
                    setProFormaAbbrev,
                    handleFileDownload,
                    CardType.Details,
                    loadingState,
                    setLoadingState,
                  )}
                </Stack>
              </AccordionDetails>
            </StyledAccordion>
          </Paper>
        ))}
      </Masonry>
    </Box>
  );

  return (
    <>
      { renderTitleOrError(proformaError, proFormaErrorMessage) }
      { renderEmptyState(proformaList.length === 0, proformaError)}
      { renderContent() }
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
