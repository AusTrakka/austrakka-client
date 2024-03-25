import React from 'react';
import { ArrowDropDown, ArrowDropUp, Sort } from '@mui/icons-material';

/* eslint-disable no-nested-ternary */
const sortIcon = (options : any) => {
  const icon = (
    <div className="custom-icon-container">
      {options.sorted ?
        (
          options.sortOrder < 0 ? (
            <ArrowDropDown fontSize="small" color="success" />
          ) : (
            <ArrowDropUp fontSize="small" color="success" />
          )
        ) : (
          <Sort fontSize="small" color="action" />
        )}
    </div>
  );
  return icon;
};

export default sortIcon;
