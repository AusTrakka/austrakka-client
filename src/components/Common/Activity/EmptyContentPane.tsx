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

function EmptyContentPane({ message, icon, subText }: EmptyContentProps) {
  let component = <Inbox className="icon-style" />;

  if (icon === ContentIcon.Forbidden) {
    component = <Https className="icon-style" />;
  } else if (icon === ContentIcon.Error) {
    component = <ErrorOutline className="icon-style" />;
  } else if (icon === ContentIcon.Loading) {
    component = <CircularProgress className="icon-style" />;
  }

  return (
    <div className="empty-container">
      <div className="icon-background">
        {component}
      </div>

      <p className="main-text">
        {message || 'No content to show'}
      </p>

      {subText && (
        <p className="sub-text">
          {subText}
        </p>
      )}
    </div>
  );
}

export default EmptyContentPane;
