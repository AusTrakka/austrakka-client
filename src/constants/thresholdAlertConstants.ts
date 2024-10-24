export const AlertLevels : Record<string, string> = {
  NoAlert: 'No Alert',
  Monitor: 'Monitor',
  Review: 'Review',
  Investigate: 'Investigate',
};

export const AlertThresholds : Record<string, number> = {
  NoAlert: 0.0,
  Monitor: 1.5,
  Review: 3.0,
  Investigate: 5.0,
};

export const OrderedAlertLevels = Object.keys(AlertLevels).sort(
  (a, b) => AlertThresholds[a] - AlertThresholds[b],
);

export const ThresholdAlertFields = {
  Date: 'Date_notification',
  Identifier: 'PHESS_ID',
};

export const ThresholdAlertDates = {
  PreviousYears: 5,
  DateWindowWeeks: 6,
};
