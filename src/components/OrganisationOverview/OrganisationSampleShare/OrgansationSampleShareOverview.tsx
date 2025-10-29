import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { Organisation } from '../../../types/dtos';
import { useAppSelector } from '../../../app/store';
import { selectUserState, UserSliceState } from '../../../app/userSlice';

function OrganisationSampleShareOverview() {
  const { orgAbbrev } = useParams();
  if (!orgAbbrev) {
    // This will most have to be a state gets turned on with a valid
    throw Error('No orgAbbrev not provided or is invalid');
  }
  
  const [organsiation, setOrganisation] = useState<Organisation>();
  const [orgShareError, setOrgShareError] = useState<boolean>(false);
  const [orgShareErrorMessage, setOrgShareErrorMessage] = useState<string | null>(null);
  
  const user: UserSliceState = useAppSelector(selectUserState);
  
  // Title subtitle
  // Then link to a Selectable table component
  // Controls need to be somewhere
  // This page will take the selected samples and the controllers' selection and process them
  // this will result in one api call that will share samples for the admin user
  return (
    <div>
      <Typography>
        {`This is the sample share overview page for ${orgAbbrev}`}
      </Typography>
    </div>
  );
}

export default OrganisationSampleShareOverview;
