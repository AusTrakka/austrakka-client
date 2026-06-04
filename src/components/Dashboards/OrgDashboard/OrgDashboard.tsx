import { Box, Card, CardContent, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import {
  fetchGroupMetadata,
  type GroupMetadataState,
  selectAwaitingGroupMetadata,
  selectGroupMetadata,
} from '../../../app/groupMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import LoadingState from '../../../constants/loadingState';
import { cardStyle } from '../../../styles/dashboardStyles';
import HasSeqEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import ProjectsTotal from '../../Widgets/UserWidgets/ProjectsTotal/ProjectsTotal';
import UserOverview from '../../Widgets/UserWidgets/UserOverview/UserOverview';

const TESTING_GROUP_CX = 10;

interface OrgDashboardProps {
  orgAbbrev: string;
}

function OrgDashboard(props: OrgDashboardProps) {
  const { orgAbbrev } = props;
  const groupContext = TESTING_GROUP_CX;
  const { token, tokenLoading } = useApi();
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const metadata: GroupMetadataState | null = useAppSelector((state) =>
    selectGroupMetadata(state, groupContext),
  );
  const isSamplesLoading: boolean = useAppSelector((state) =>
    selectAwaitingGroupMetadata(state, groupContext),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only needed to suppress when using testing groupCtx const
  useEffect(() => {
    if (
      groupContext !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      setAllFieldsLoaded(false);
      dispatch(fetchGroupMetadata({ groupId: groupContext, token, orgAbbrev }));
    }
  }, [groupContext, orgAbbrev, token, tokenLoading, dispatch]);

  return (
    <Grid container spacing={2}>
      <Chip label="success" color="success" variant="outlined" />
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
        {isSamplesLoading ? (
          <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center">
            Loading...
          </Grid>
        ) : null}
        {/* Preliminary template for gathering feedback */}
        {!isSamplesLoading ? <Grid></Grid> : null}
      </Grid>
    </Grid>
  );
}
export default OrgDashboard;
