import React from 'react';
import { Inbox } from '@mui/icons-material';

interface EmptyContentProps {
    message?: string;
}

const EmptyContentPane: React.FC<EmptyContentProps> = ({ message }) => {
    return (
        <div style={containerStyles}>
            <div style={iconBackgroundStyles}>
                <Inbox sx={iconStyles} />
            </div>
            <p style={textStyles}>{message || 'No content to show'}</p>
        </div>
    );
};

// TODO: move to this way of coding style so that the dom structure
// are easier to read. However, examine what colours are specific to
// this component and what are global. Do this with all components.
const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--primary-main-bg)',
};

const iconStyles: React.CSSProperties = {
    fontSize: '60px',
    color: 'rgb(10,53,70,0.54)',
};

const iconBackgroundStyles: React.CSSProperties = {
    borderRadius: '50%',
    height: '160px',
    width: '160px',
    backgroundColor: 'rgb(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '40px',
}

const textStyles: React.CSSProperties = {
    fontSize: '19px',
    color: 'rgb(10,53,70,0.8)',
};

export default EmptyContentPane;
