import React from 'react';
import { InfoTooltip } from './InfoTooltip';

export function FieldLabelWithTooltip({ field, readableNames }:
{ field: string; readableNames: Record<string, string> }) {
  if (field === 'analysisServerUsername') {
    return (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {readableNames[field] || field}
        {InfoTooltip('Analysis Server Username')}
      </span>
    );
  }
  return <span>{readableNames[field] || field}</span>;
}
