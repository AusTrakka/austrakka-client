import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  CardContent,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { MoveToInbox } from '@mui/icons-material';
import { ProFormaVersion, Proforma } from '../../types/dtos';
import { getProformaDetails, getProformaVersions } from '../../utilities/resourceUtils';
import { handleProformaDownload } from './proformaUtils';
import LoadingState from '../../constants/loadingState';
import { useApi } from '../../app/ApiContext';
import { isoDateLocalDate, isoDateLocalDateNoTime } from '../../utilities/helperUtils';
import { ResponseObject } from '../../types/responseObject.interface';

function ProFormaDetail() {
  const { proformaAbbrev } = useParams();
  const [proforma, setProforma] = useState<Proforma | null>();
  const [selectedVersion, setSelectedVersion] = useState<ProFormaVersion | null>();
  const [proformaVersionList, setProformaVersionList] = useState<ProFormaVersion[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();

  const handleDownload = async (abbrev: string | null, version:number | null = null) => {
    if (!abbrev) return;
    try {
      setLoadingState(true); // Set loading state
      await handleProformaDownload(abbrev, version, token);
    } finally {
      setTimeout(() => {
        setLoadingState(false); // Reset loading state
      }, 2000); // 2000 milliseconds = 2 seconds
    }
  };

  useEffect(() => {
    const getCurrentProformaDetails = async () => {
      const proformaResponse: ResponseObject = await getProformaDetails(proformaAbbrev!, token);
      if (proformaResponse.status === 'Success') {
        setProforma(proformaResponse.data as Proforma);
        return;
      }
      setErrMsg(`Proforma ${proformaAbbrev} could not be accessed`);
    };

    const getProformas = async () => {
      const proformaResponse: ResponseObject = await getProformaVersions(proformaAbbrev!, token);
      if (proformaResponse.status === 'Success') {
        // We are going to keep: the latest version, and all versions that have an attached file
        // Also sort by version number in descending order so that current is proformaVersionList[0]
        const versions = proformaResponse.data as ProFormaVersion[];
        const keepVersions = versions.filter(v => v.isCurrent || v.originalFileName !== null)
          .sort((a, b) => b.version - a.version);
        setProformaVersionList(keepVersions);
        if (keepVersions.length > 0) {
          setSelectedVersion(keepVersions[0]);
          return;
        }
      }
      // Length was 0, or response status not success
      setErrMsg(`Proforma ${proformaAbbrev} could not be accessed`);
    };

    if (tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      getCurrentProformaDetails();
      getProformas();
    }
  }, [proformaAbbrev, token, tokenLoading]);

  const renderDownloadCard = () => {
    // Only show card if current proforma version is selected
    if (!selectedVersion?.isCurrent) return null;

    return (
      <Paper
        elevation={2}
        sx={{
          width: '50%',
          minWidth: '30em',
          margin: 'auto',
          marginTop: '2em',
          cursor: 'pointer',
        }}
      >
        <CardContent
          onClick={() =>
            handleDownload(
              selectedVersion?.abbreviation ?? null,
              !selectedVersion?.isCurrent ? selectedVersion?.version : undefined,
            )}
        >
          { selectedVersion?.originalFileName ? (
            <Stack direction="row" spacing={1}>
              {loadingState ? <CircularProgress size={35} color="secondary" /> : <MoveToInbox color="secondary" fontSize="large" />}
              <Stack direction="column" width="calc(100% - 40px)">
                <Typography gutterBottom>
                  Download latest Excel pro forma template
                </Typography>
                <Typography
                  title={selectedVersion.originalFileName}
                  noWrap
                  gutterBottom
                  variant="h5"
                  component="div"
                >
                  {selectedVersion.originalFileName}
                </Typography>
                <Typography
                  variant="caption"
                  color="black"
                  noWrap
                >
                  {selectedVersion.createdBy}
                  <br />
                  {isoDateLocalDate(selectedVersion.created.toString())}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Typography>
              This pro forma currently has no template available for download
            </Typography>
          )}
        </CardContent>
      </Paper>
    );
  };

  const versionListing = (version: ProFormaVersion) : string => {
    if (version.isCurrent) {
      return `${isoDateLocalDateNoTime(version.created.toString())} (latest)${
        version.originalFileName ? ` : ${version.originalFileName}` : ''}`;
    }
    return `${isoDateLocalDateNoTime(version.created.toString())} : ${version.originalFileName}`;
  };

  return (
    errMsg ? <Alert severity="error">{errMsg}</Alert> : (
      <>
        <Typography className="pageTitle">
          {`${proforma?.name} (${proforma?.abbreviation})`}
        </Typography>
        <Typography sx={{ mb: '2em' }}>
          {proforma?.description}
        </Typography>

        <Select
          variant="standard"
          labelId="version-select-label"
          id="version-select-label"
          label="Version"
          value={selectedVersion?.version.toString() ?? ''}
          onChange={(e) =>
            setSelectedVersion(proformaVersionList.find(
              v => v.version.toString() === e.target.value,
            ))}
        >
          {proformaVersionList.map((version) => (
            <MenuItem key={version.version} value={version.version.toString()}>
              {versionListing(version)}
            </MenuItem>
          ))}
        </Select>

        {renderDownloadCard()}

        <Typography sx={{ mt: 3 }}>
          The following fields are accepted in uploads for this pro forma, and will be validated
          against field types and values. &quot;Strictly required&quot; fields cannot be left blank
          in any upload. Some fields which are not strictly required, and which may be temporarily
          left blank, may still form part of the minimum expected metadata set for a project.
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ mt: 3,
            mb: 4,
            ml: 'auto',
            mr: 'auto',
            maxWidth: '60em' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  style={{ fontWeight: 'bold' }}
                >
                  Field
                </TableCell>
                <TableCell
                  align="center"
                  style={{ fontWeight: 'bold' }}
                >
                  <div title="Strictly required fields cannot be left blank in any upload">
                    Strictly required
                  </div>
                </TableCell>
                <TableCell
                  align="right"
                  style={{ fontWeight: 'bold' }}
                >
                  Type
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedVersion?.columnMappings.map((row) => (
                <TableRow key={row.metaDataColumnName}>
                  <TableCell component="th" scope="row">
                    {row.metaDataColumnName}
                  </TableCell>
                  <TableCell align="center">{row.isRequired.toString()}</TableCell>
                  <TableCell align="right">{row.metaDataColumnPrimitiveType === null ? 'categorical' : row.metaDataColumnPrimitiveType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    )
  );
}

export default ProFormaDetail;
