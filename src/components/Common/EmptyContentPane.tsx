import React from 'react';
import {Inbox} from "@mui/icons-material";

interface EmptyContentProps {
    message?: string;
}

const EmptyContentPane: React.FC<EmptyContentProps> = ({ message }) => {
    return (
        <div style={containerStyles}>
            <Inbox sx={{fontSize:'60px', color:'var(--primary-main)'}} />
            <p style={textStyles}>{message || 'No content to show'}</p>
        </div>
    );
};

// Define styles as objects
const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    backgroundColor: 'inherit',
};

const textStyles: React.CSSProperties = {
    fontSize: '16px',
    color: '#757575',
};

export default EmptyContentPane;
