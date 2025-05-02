import React, { FC, useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import { ActivityDetailInfo } from './activityViewModels.interface';
import DetailedText from '../Page/DetailedText';
import { formatDate } from '../../../utilities/dateUtils';

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

const fieldOrder : string[] = ['Operation name', 'Time stamp', 'Event initiated by', 'Resource', 'Resource Type'];

const ActivityContentBox: FC<ContentBoxProps> = ({ entry, marginTop }) => {
  const mgt = marginTop || '0px';
  const genericDetails: GenericDetails | null = entry.Details ? JSON.parse(entry.Details) : null;
    
  const styles = {
    tableCell: {
      padding: '8px 0px',
      verticalAlign: 'top', // Align the "Details" title to the top
    },
    ul: {
      listStyleType: 'none', // Remove bullet points
      paddingLeft: '0px',
      marginTop: '0px',
    },
    li: {
      marginBottom: '15px', // Space out the list items by 15px
    },
  };

  const details = () => (
    <tr key="details">
      <td style={styles.tableCell}>
        <DetailedText text="Details" isSubHeading />
      </td>
      <td style={{ ...styles.tableCell, paddingLeft: '100px' }}>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <DetailedText text="Event start date" isSubHeading />
            <DetailedText text={formatDate(genericDetails!.InitialEventDateTime)} />
          </li>
          <li style={styles.li}>
            <DetailedText text="Recent event date" isSubHeading />
            <DetailedText text={formatDate(genericDetails!.RecentEventDateTime)} />
          </li>
          {
                            genericDetails?.Sections?.map(
                              (section: SummarySection, index: number) => (
                                <li key={index} style={styles.li}>
                                  <DetailedText text={section.Title} isSubHeading />
                                  <DetailedText text={section.Description} />
                                  <span />
                                  {section?.Values && section.Values.map((value: string, index: number) => (
                                    <DetailedText key={index} text={value} />
                                  ))}
                                  {section?.DynamicProperties && Object.keys(section.DynamicProperties).map(
                                    (key: string, index: number) => (
                                      <DetailedText
                                        key={key + index.toString()}
                                        text={`${key}: ${section.DynamicProperties[key]}`}
                                      />
                                    ),
                                  )}
                                </li>
                              ),
                            )
                        }
        </ul>
      </td>
    </tr>
  );

  const renderDetailTab = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '22px' }}>
      <tbody>
        {fieldOrder.map(f => (
          <tr key={f}>
            <td style={{ padding: '8px 0px' }}>
              <DetailedText text={f} isSubHeading />
            </td>
            <td style={{ padding: '8px 8px 8px 100px' }}>
              <DetailedText text={f === 'Time stamp'
                ? formatDate(entry[f as keyof ActivityDetailInfo])
                : entry[f as keyof ActivityDetailInfo]}
              />
            </td>
          </tr>
        ))}
        {genericDetails && details()}
      </tbody>
    </table>
  );

  return (
    <>
      <Tabs value={0} sx={{ color: 'var(--primary-main)', marginTop: mgt }}>
        <Tab
          key={0}
          tabIndex={0}
          label="Details"
          sx={{ fontSize: '16px' }}
        />
      </Tabs>
      {renderDetailTab()}
    </>
  );
};

export default ActivityContentBox;
