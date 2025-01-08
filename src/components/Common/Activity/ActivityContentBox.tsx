import React, {FC, useState} from 'react';
import {Tab, Tabs} from "@mui/material";
import {ActivityDetailInfo} from "./activityViewModels.interface";
import DetailedText from "../Page/DetailedText";
import {formatDate} from "../../../utilities/dateUtils";

interface ContentBoxProps {
    entry: ActivityDetailInfo,
    marginTop?: string,
}

const fieldOrder : string[] = ['Operation name', 'Time stamp', 'Event initiated by', 'resource', 'resourceType'];

const ContentBox: FC<ContentBoxProps> = ({entry, marginTop}) => {
    const mgt = marginTop ? marginTop : '0px';
    
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

export default ContentBox;
