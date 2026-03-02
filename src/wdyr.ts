import whyDidYouRender from '@welldone-software/why-did-you-render';
import React from 'react';
import { ReactReduxContext } from 'react-redux';

if (import.meta.env.DEV) {
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    collapseGroups: true,
    titleColor: 'yellow',
    diffNameColor: 'lightblue',
    diffPathColor: 'red',
    trackExtraHooks: [[ReactReduxContext, 'useSelector']],
    logOnDifferentValues: true,
    exclude: [/^Body/, /^Table/, /^Header/, /^Virtual/],
  });
}
