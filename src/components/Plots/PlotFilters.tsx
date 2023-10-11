/* eslint-disable @typescript-eslint/no-unused-vars */

import { Box, TextField, Button } from '@mui/material';
import React, { useEffect, useState } from 'react';

const testData = [
  {
    'Seq_ID': 'Sample1',
    'Date_coll': '2021-02-02T00:00:00Z',
    'Species': 'sp1',
    'Has_sequences': true,
    'TestCategorical': 'First',
  },
  {
    'Seq_ID': 'Sample10',
    'Date_coll': '2020-02-09T00:00:00Z',
    'Species': 'sp5',
    'Has_sequences': null,
    'TestCategorical': 'Fifth',
  },
  {
    'Seq_ID': 'Sample11',
    'Date_coll': '2020-02-03T00:00:00Z',
    'Species': 'sp1',
    'Has_sequences': null,
    'TestCategorical': 'First',
  },
];

interface PlotFiltersProps {
  data: any
  filteredData: any
  setFilteredData: any
}

function PlotFilters(props: PlotFiltersProps) {
  const { data, filteredData, setFilteredData } = props;
  return (
    <Box>
      <TextField />
      <br />
      <Button onClick={() => setFilteredData(testData)}>Filter plot view</Button>
      <br />
      <Button onClick={() => setFilteredData(data)}>Refresh plot view</Button>
    </Box>
  );
}
export default PlotFilters;
