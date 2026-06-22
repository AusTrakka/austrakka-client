import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import {
  fetchOrgMetadata,
  type OrgMetadataState,
  selectAwaitingOrgMetadata,
  selectOrgMetadata,
} from '../../../app/orgMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import LoadingState from '../../../constants/loadingState';

interface OrgDashboardProps {
  orgAbbrev: string;
}

function OrgDashboard(props: OrgDashboardProps) {
  const { orgAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const metadata: OrgMetadataState | null = useAppSelector((state) =>
    selectOrgMetadata(state, orgAbbrev),
  );
  const isSamplesLoading: boolean = useAppSelector((state) =>
    selectAwaitingOrgMetadata(state, orgAbbrev),
  );

  useEffect(() => {
    if (
      orgAbbrev !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      setAllFieldsLoaded(false);
      dispatch(fetchOrgMetadata({ token, orgAbbrev }));
    }
  }, [orgAbbrev, token, tokenLoading, dispatch]);

  return (
    <Grid container spacing={2}>
      <Grid
        container
        size={12}
        spacing={2}
        sx={{
          marginTop: 1,
          padding: 2,
          backgroundColor: Theme.PrimaryMainBackground,
          flex: 1,
          minHeight: '100%',
        }}
      >
        {isSamplesLoading || !allFieldsLoaded ? (
          <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center">
            Loading...
          </Grid>
        ) : (
          <Grid>{metadata ? 'Metadata loaded' : 'No metadata available'}</Grid>
        )}
      </Grid>
    </Grid>
  );
}
export default OrgDashboard;
