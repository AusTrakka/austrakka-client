import React from 'react';
import {Cancel, ErrorOutline, Https, Inbox} from '@mui/icons-material';

export enum ContentIcon {
    Inbox = 'Inbox',
    Forbidden = 'Forbidden',
    Error = 'Error',
}

interface EmptyContentProps {
    message?: string;
    subText?: string;
    icon?: ContentIcon;
}

const EmptyContentPane: React.FC<EmptyContentProps> = ({ message, icon, subText }) => {
    let iconComponent = <Inbox sx={iconStyles} />;
    if (icon === ContentIcon.Forbidden) {iconComponent = <Https sx={iconStyles} />;}
    else if (icon === ContentIcon.Error) { iconComponent = <ErrorOutline sx={iconStyles} />}
    
    return (
        <div style={containerStyles}>
            <div style={iconBackgroundStyles}>
                { iconComponent }
            </div>
            <p style={textStyles}>{message || 'No content to show'}</p>
            {subText && <p style={subTextStyles}>{subText}</p>}
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
    padding: '200px 20px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--primary-main-bg)',
    borderRadius: 'var(--primary-radius)',
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
    marginBottom: '10px',
    marginTop: '1em',
};

const subTextStyles: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgb(10,53,70,0.7)',
    margin: 0,
};

export default EmptyContentPane;
