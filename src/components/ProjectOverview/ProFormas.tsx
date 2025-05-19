/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper, Accordion, styled,
  AccordionSummary, AccordionDetails, Icon, Stack, Alert } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Masonry from '@mui/lab/Masonry';
import { useNavigate } from 'react-router-dom';
import { ProFormaVersion, Project } from '../../types/dtos';
import GenerateCards, { CardType } from '../ProForma/CardGenerator';
import { handleProformaDownload } from '../ProForma/proformaUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { getGroupProFormaVersions } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';

// Local Proforma Props
interface ProFormasListProps {
  projectDetails: Project | null;
  isProformasLoading: boolean,
  setIsProformasLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

function ProFormaList(props: ProFormasListProps) {
  const { projectDetails,
    isProformasLoading,
    setIsProformasLoading } = props;

  const [proformaList, setProformaList] = useState<ProFormaVersion[]>([]);
  const [proformaError, setProformaError] = useState(false);
  const [proformaErrorMessage, setProformaErrorMessage] = useState('');
  const { token } = useApi();
  const navigate = useNavigate();

  // Used by GenerateCards
  const [loadingState, setLoadingState] = useState<number | null>(null);

  useEffect(() => {
    async function getProFormaList() {
      const proformaListResponse : ResponseObject =
        await getGroupProFormaVersions(projectDetails!.projectMembers.id, token);
      if (proformaListResponse.status === ResponseType.Success) {
        const data = proformaListResponse.data as ProFormaVersion[];
        setProformaList(data);
        setIsProformasLoading(false);
      } else {
        setIsProformasLoading(false);
        setProformaList([]);
        setProformaError(true);
        setProformaErrorMessage(proformaListResponse.message);
      }
    }

    if (projectDetails) {
      getProFormaList();
    }
  }, [projectDetails, token, setIsProformasLoading]);

  const handleFileDownload = async (dAbbrev: string, version : number | null) => {
    handleProformaDownload(dAbbrev, version, token);
  };

  const handleRedirect = (version: ProFormaVersion) => {
    const { abbreviation } = version;
    const url = `/proformas/${abbreviation}`;
    navigate(url);
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
    backgroundColor: 'var(--primary-grey-100)',
    color: theme.palette.text.secondary,
    flexDirection: 'column',
  }));

  const renderTitleOrError = (hasError: boolean, errMsg: string) => (
    hasError ?
      <Alert severity="error">{errMsg}</Alert>
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
            sx={{ minWidth: '350px',
              maxWidth: '350px',
              minHeight: '352px',
              backgroundColor: 'var(--primary-grey-100)' }}
          >
            <StyledAccordion sx={{ pointerEvents: 'none', margin: '0px' }}>
              <AccordionSummary
                sx={{ flexDirection: 'column', margin: 0, minHeight: '352px' }}
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
                      handleFileDownload,
                      groupedObjects[index][0].assetId ? CardType.Summary : CardType.Reference,
                      loadingState,
                      setLoadingState,
                      handleRedirect,
                    )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ flexDirection: 'column',
                paddingLeft: '35px',
                paddingBottom: 5,
                paddingTop: 3 }}
              >
                <Stack spacing={3} sx={{ justifyContent: 'space-evenly' }}>
                  <Typography variant="overline">
                    Previous Versions
                  </Typography>
                  {GenerateCards(
                    groupedObjects[index].slice(1),
                    handleFileDownload,
                    CardType.Details,
                    loadingState,
                    setLoadingState,
                    handleRedirect,
                  )}
                </Stack>
              </AccordionDetails>
            </StyledAccordion>
          </Paper>
        ))}
      </Masonry>
    </Box>
  );

  if (isProformasLoading) return null;

  return (
    <>
      { renderTitleOrError(proformaError, proformaErrorMessage) }
      { renderEmptyState(proformaList.length === 0, proformaError)}
      { renderContent() }
    </>
  );
}

export default ProFormaList;
