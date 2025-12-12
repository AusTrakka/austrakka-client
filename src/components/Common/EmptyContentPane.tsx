import React from 'react';
import { ErrorOutline, Https, Inbox } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

export enum ContentIcon {
  InTray = 'Inbox',
  Forbidden = 'Forbidden',
  Error = 'Error',
  Loading = 'Loading',
}

interface EmptyContentProps {
  message?: string;
  subText?: string;
  icon?: ContentIcon;
}

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
  borderRadius: '5px',
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
};

const textStyles: React.CSSProperties = {
  fontSize: '19px',
  color: 'rgb(10,53,70,0.8)',
  marginBottom: '10px',
  marginTop: '1em',
};

const subTextStyles: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgb(10,53,70,0.7)',
  margin: 0,
};

function EmptyContentPane({ message, icon, subText }: EmptyContentProps): any {
  let component = <Inbox sx={iconStyles} />;
  
  if (icon === ContentIcon.Forbidden) {
    component = <Https sx={iconStyles} />;
  } else if (icon === ContentIcon.Error) {
    component = <ErrorOutline sx={iconStyles} />;
  } else if (icon === ContentIcon.Loading) {
    component = <CircularProgress sx={iconStyles} />;
  }

  return (
    <div style={containerStyles}>
      <div style={iconBackgroundStyles}>
        { component }
      </div>
      <p style={textStyles}>{message || 'No content to show'}</p>
      {subText && <p style={subTextStyles}>{subText}</p>}
    </div>
  );
}

export default EmptyContentPane;
