import React, {FC} from "react";
import {Typography} from "@mui/material";

interface DetailedTextProps {
    text: string,
    isSubHeading?: boolean,
}

const DetailedText : FC<DetailedTextProps> = ({text, isSubHeading}) => {
    const semiBold = "600";
    const fontWeight = isSubHeading ? semiBold : "normal";
    return (
        <Typography
            className="detailed-text"
            sx={{
                fontSize: '14px',
                marginTop: 0,
                fontWeight: fontWeight,
                color: 'rgb(50,49,48)'
            }}
        >
            {text}
        </Typography>
    );
}

export default DetailedText;