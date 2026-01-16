import React from 'react';
import { Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { ActivityDetailInfo } from './activityViewModels.interface';
import { formatDate } from '../../../utilities/dateUtils';

interface ContentBoxProps {
  entry: ActivityDetailInfo,
  marginTop?: string,
}

const fieldOrder: string[] = ['Event', 'Time stamp', 'Event initiated by', 'Resource', 'Resource Type'];

function ActivityContentBox({ entry, marginTop = '0px' }: ContentBoxProps): JSX.Element {
  const renderDetailTab = () => (
    <Table sx={{ 'width': '100%',
      'borderCollapse': 'collapse',
      'mt': '22px',
      '& td, & th': { borderBottom: 'none' } }}
    >
      <TableBody>
        {fieldOrder.map(f => {
          const value =
          f === 'Time stamp'
            ? formatDate(entry[f as keyof ActivityDetailInfo])
            : entry[f as keyof ActivityDetailInfo];
          
          return (
            <TableRow key={f}>
              <TableCell sx={{ p: '8px 0px', verticalAlign: 'top' }}>
                <Typography sx={{ fontWeight: 600 }}>{f}</Typography>
              </TableCell>
              <TableCell sx={{ p: '8px 8px 8px 100px', verticalAlign: 'top' }}>
                <Typography>{value}</Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <Typography
        variant="h4"
        marginTop={marginTop}
        color="primary"
      >
        Details
      </Typography>
      {renderDetailTab()}
    </div>
  );
}

export default ActivityContentBox;
