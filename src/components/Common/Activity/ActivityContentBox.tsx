import { Box, Chip, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { formatDate } from '../../../utilities/dateUtils';
import JsonTreeView from '../JsonTreeView';
import type { ActivityDetailInfo, VisChainEntry } from './activityViewModels.interface';

interface ContentBoxProps {
  entry: ActivityDetailInfo;
  logContext: VisChainEntry[];
}

// Hide certain keys which are known to be non-informative
const HIDDEN_DETAIL_KEYS: string[] = ['GlobalId', 'ProjectGlobalId', 'OrganisationGlobalId'];
const displayFields: string[] = [
  'Event',
  'Time stamp',
  'Event initiated by',
  'Resource',
  'Resource Type',
  'Context',
];

function ActivityContentBox({ entry, logContext }: ContentBoxProps): JSX.Element {
  return (
    <>
      <Table
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          mt: '22px',
          '& td, & th': { borderBottom: 'none' },
        }}
      >
        <TableBody>
          {displayFields.map((f) => {
            if (f === 'Context') {
              if (logContext && logContext.length > 0) {
                return (
                  <TableRow key={f}>
                    <TableCell sx={{ p: '8px 0px', verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Context
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: '8px 8px 8px 100px', verticalAlign: 'top' }}>
                      <Box>
                        {logContext.map((contextEntry) => (
                          <Typography key={contextEntry.UniqueStringId} variant="body2">
                            {contextEntry.ResourceType}
                            <Chip label={contextEntry.UniqueStringId} sx={{ ml: 1 }} />
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              } else {
                return null;
              }
            }
            const value =
              f === 'Time stamp'
                ? formatDate(entry[f as keyof ActivityDetailInfo])
                : entry[f as keyof ActivityDetailInfo];

            return (
              <TableRow key={f}>
                <TableCell sx={{ p: '8px 0px', verticalAlign: 'top' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {f}
                  </Typography>
                </TableCell>
                <TableCell sx={{ p: '8px 8px 8px 100px', verticalAlign: 'top' }}>
                  <Typography variant="body2">{value}</Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <JsonTreeView
        key={entry.GlobalId}
        data={entry.Details}
        label="Additional Details"
        hiddenKeys={HIDDEN_DETAIL_KEYS}
      />
    </>
  );
}

export default ActivityContentBox;
