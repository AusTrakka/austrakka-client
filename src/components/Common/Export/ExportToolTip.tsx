import {IconButton, Tooltip} from "@mui/material";
import {SimCardDownload} from "@mui/icons-material";
import React from "react";

interface ExportToolTipProps {
    disabled: boolean,
    exportData: () => void
}

const ExportToolTip = (props: ExportToolTipProps) => {
    return (
        <>
            <Tooltip title="Export to CSV" placement="top" arrow>
                <span>
                    <IconButton
                      onClick={() => { props.exportData(); }}
                      disabled={props.disabled}
                      color={props.disabled ? 'secondary' : 'default'}
                    >
                    <SimCardDownload />
                    </IconButton>
                </span>
          </Tooltip>
      </>  
    );
}

export default ExportToolTip;