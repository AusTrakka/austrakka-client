import { Box } from '@mui/material';
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
