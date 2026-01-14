import React from 'react';
import { Box, Tab, Table, TableBody, TableCell, TableRow, Tabs, Typography } from '@mui/material';
import { ActivityDetailInfo } from './activityViewModels.interface';
import DetailedText from '../Page/DetailedText';
import { formatDate } from '../../../utilities/dateUtils';
import { Theme } from '../../../assets/themes/theme';

interface ContentBoxProps {
  entry: ActivityDetailInfo,
  marginTop?: string,
}

interface SummarySection {
  Title: string,
  Description: string,
  Values: string[] | null,
  DynamicProperties: any | null
}

interface GenericDetails {
  InitialEventDateTime: string,
  RecentEventDateTime: string,
  Sections: SummarySection[] | null,
}

const fieldOrder: string[] = ['Operation name', 'Time stamp', 'Event initiated by', 'Resource', 'Resource Type'];

function ActivityContentBox({ entry, marginTop = '0px' }: ContentBoxProps): JSX.Element {
  const genericDetails: GenericDetails | null = entry.Details ? JSON.parse(entry.Details) : null;

  const details = () => (
    <TableRow>
      <TableCell
        style={{
          padding: '8px 0px',
          verticalAlign: 'top',
        }}
      >
        <DetailedText text="Details" isSubHeading />
      </TableCell>

      <TableCell
        style={{
          padding: '8px 0px 8px 100px',
          verticalAlign: 'top',
        }}
      >
        <Box>
          <Box style={{ marginBottom: '15px' }}>
            <DetailedText text="Event start date" isSubHeading />
            <DetailedText text={formatDate(genericDetails!.InitialEventDateTime)} />
          </Box>

          <Box style={{ marginBottom: '15px' }}>
            <DetailedText text="Recent event date" isSubHeading />
            <DetailedText text={formatDate(genericDetails!.RecentEventDateTime)} />
          </Box>

          {genericDetails?.Sections?.map((section: SummarySection) => (
            <Box key={section.Title} style={{ marginBottom: '15px' }}>
              <DetailedText text={section.Title} isSubHeading />
              <DetailedText text={section.Description} />
              {section?.Values?.map((value: string) => (
                <DetailedText
                  key={section.Title + value}
                  text={value}
                />
              ))}

              {section?.DynamicProperties &&
                Object.keys(section.DynamicProperties).map((key: string) => (
                  <DetailedText
                    key={key}
                    text={`${key}: ${section.DynamicProperties[key]}`}
                  />
                ))}
            </Box>
          ))}
        </Box>
      </TableCell>
    </TableRow>
  );

  const renderDetailTab = () => (
    <Table sx={{ 'width': '100%',
      'borderCollapse': 'collapse',
      'mt': '22px',
      '& td, & th': { borderBottom: 'none' } }}
    >
      <TableBody>
        {fieldOrder.map(f => (
          <TableRow key={f}>
            <TableCell sx={{ p: '8px 0px', verticalAlign: 'top' }}>
              <DetailedText text={f} isSubHeading />
            </TableCell>

            <TableCell sx={{ p: '8px 8px 8px 100px', verticalAlign: 'top' }}>
              <DetailedText
                text={
                f === 'Time stamp'
                  ? formatDate(entry[f as keyof ActivityDetailInfo])
                  : entry[f as keyof ActivityDetailInfo]
              }
              />
            </TableCell>
          </TableRow>
        ))}

        {genericDetails && details()}
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
