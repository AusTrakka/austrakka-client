import { Box, Typography } from '@mui/material';
import OrgSamplesTable from './OrgSamplesTable';

interface OrganisationSampleProps {
  canShare: boolean;
  canChangeOwnership: boolean;
  orgAbbrev: string;
  orgName: string;
}

function OrganisationSamples(props: OrganisationSampleProps) {
  const { canShare, canChangeOwnership, orgAbbrev, orgName } = props;
  return (
    <Box>
      <Typography sx={{ paddingBottom: 2 }} align="left" variant="subtitle2" color="primary">
        View samples owned by your organisation. Please note you will only be able to view
        <em> all </em>
        data for the organisation you are in, if you are a<b> viewer </b>
        in your organisation&lsquo;s
        <b> Owner group</b>.
      </Typography>
      <OrgSamplesTable
        canShare={canShare}
        orgAbbrev={orgAbbrev}
        canChangeOwnership={canChangeOwnership}
        orgName={orgName}
      />
    </Box>
  );
}
export default OrganisationSamples;
