import React, {FC, useState} from 'react';
import {Tab, Tabs} from "@mui/material";
import {ActivityDetailInfo} from "./activityViewModels.interface";
import DetailedText from "../Page/DetailedText";
import {formatDate} from "../../../utilities/dateUtils";

interface ContentBoxProps {
    entry: ActivityDetailInfo,
    marginTop?: string,
}

interface GenericDetails {
    EventStartDate: string,
    RecentEventDate: string,
    ResourceIds: string[],
}

const fieldOrder : string[] = ['Operation name', 'Time stamp', 'Event initiated by', 'Resource', 'Resource Type'];

const ActivityContentBox: FC<ContentBoxProps> = ({entry, marginTop}) => {
    const mgt = marginTop ? marginTop : '0px';
    const genericDetails: GenericDetails | null = entry.Details ? JSON.parse(entry.Details) : null;
    
    const styles = {
        tableCell: {
            padding: '8px 0px',
            verticalAlign: 'top',  // Align the "Details" title to the top
        },
        ul: {
            listStyleType: 'none',  // Remove bullet points
            paddingLeft: '0px',
            marginTop: '0px', 
        },
        li: {
            marginBottom: '15px',  // Space out the list items by 15px
        },
    };

    const details = () => {
        return (
            <tr key="details">
                <td style={styles.tableCell}>
                    <DetailedText text="Details" />
                </td>
                <td style={{ ...styles.tableCell, paddingLeft: '100px' }}>
                    <ul style={styles.ul}>
                        <li key="EventStartDate" style={styles.li}>
                                <DetailedText text="Event start date" />
                                <DetailedText text={formatDate(genericDetails!.EventStartDate)} />
                        </li>
                        <li key="RecentEventDate" style={styles.li}>
                                <DetailedText text="Recent event date" />
                                <DetailedText text={formatDate(genericDetails!.RecentEventDate)} />
                        </li>
                        <li key="ResourceIds" style={styles.li}>
                                <DetailedText text="ResourceIds" />
                            {genericDetails!.ResourceIds.map((id: string, index: number) => (
                                <>
                                    <DetailedText text={id} display="inline-block"/>
                                    {index < genericDetails!.ResourceIds.length - 1 
                                        && <DetailedText text=", " display="inline-block"/>}
                                </>
                            ))}
                        </li>
                    </ul>
                </td>
            </tr>
        );
    };

    const renderDetailTab = () => {
        return (
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '22px'}}>
                <tbody>
                {fieldOrder.map( f => (
                    <tr key={f}>
                        <td style={{padding: '8px 0px'}}>
                            <DetailedText text={f} />
                        </td>
                        <td style={{padding: '8px 8px 8px 100px'}}>
                            <DetailedText text={f === "Time stamp" ? formatDate(entry[f]) :entry[f]} />
                        </td>
                    </tr>
                ))}
                {genericDetails && details()}
                </tbody>
            </table>
        );
    };

    return (
        <>
            <Tabs value={0} sx={{color: 'var(--primary-main)', marginTop: mgt}}>
                <Tab
                    key={0}
                    tabIndex={0}
                    label="Details"
                    sx={{fontSize: '16px'}}
                />
            </Tabs>
            {renderDetailTab()}
        </>
    );
};

export default ActivityContentBox;
