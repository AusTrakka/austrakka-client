import React from 'react';
import { ReactReduxContext } from 'react-redux';

if (import.meta.env.DEV) {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import('@welldone-software/why-did-you-render').then(({ default: whyDidYouRender }) => {
    whyDidYouRender(React, {
      trackAllPureComponents: false,
      collapseGroups: true,
      titleColor: 'yellow',
      diffNameColor: 'lightblue',
      diffPathColor: 'red',
      trackExtraHooks: [
        [ReactReduxContext, 'useSelector'],
      ],
      logOnDifferentValues: true,
      exclude: [/^Body/, /^Table/, /^Header/, /^Virtual/],
    });
  });
}
