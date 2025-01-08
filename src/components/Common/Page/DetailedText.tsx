import React, {FC} from "react";
import {Typography} from "@mui/material";

interface DetailedTextProps {
    text: string,
}

const DetailedText : FC<DetailedTextProps> = ({text}) => {
    return (
        <Typography
            className="detailed-text"
            sx={{
                fontSize: '14px',
                marginTop: 0,
            }}
        >
            {text}
        </Typography>
    );
}

export default DetailedText;