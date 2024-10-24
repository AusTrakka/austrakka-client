import {
  AlertLevels,
  AlertThresholds,
  ThresholdAlertFields,
  OrderedAlertLevels,
} from '../constants/thresholdAlertConstants';
import { Sample } from '../types/sample.interface';
import { isNullOrEmpty } from './dataProcessingUtils';

export interface ThresholdAlert {
  alertLevelOrder: number;
  alertLevel: string;
  ratio: number | null;
  categoryField: string;
  categoryValue: string;
  recentCount: number;
}

export const calculateAlert = (
  alertField: string,
  alertFieldValue: string,
  alertEndDate: Date,
  timeWindowWeeks: number,
  previousYears: number,
  data: Sample[],
): ThresholdAlert => {
  // Does NOT filter alertField on alertValue; expects data to contain only relevant rows
  
  // Deduplicate this dataset by ID, taking earliest date
  const dedupedMap = data
    .reduce((acc, row) => {
      const id = row[ThresholdAlertFields.Identifier];
      const existing = acc.get(id);
      if (!existing || row[ThresholdAlertFields.Date] < existing[ThresholdAlertFields.Date]) {
        acc.set(id, row);
      }
      return acc;
    }, new Map());
  data = Array.from(dedupedMap.values());

  // Count records in the current time window
  const currentStartDate = new Date(alertEndDate);
  currentStartDate.setDate(currentStartDate.getDate() - 7 * timeWindowWeeks);
  
  const recentCount = data.filter(row => {
    const rowDate = new Date(row[ThresholdAlertFields.Date]);
    return rowDate > currentStartDate && rowDate <= alertEndDate;
  }).length;

  // Sum up records in previous years' time windows
  let historicalCount = 0;
  let yearsBack = 0;
  while (yearsBack < previousYears) {
    yearsBack += 1;
    const previousEndDate = new Date(alertEndDate);
    previousEndDate.setFullYear(previousEndDate.getFullYear() - yearsBack);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7 * timeWindowWeeks);
    historicalCount += data.filter(row => {
      const rowDate = new Date(row[ThresholdAlertFields.Date]);
      return rowDate > previousStartDate && rowDate <= previousEndDate;
    }).length;
  }

  // Calculate the alert
  let alertLevel: string;
  let ratio: number | null = null;
  if (recentCount === 0) {
    alertLevel = AlertLevels.NoAlert;
    if (historicalCount !== 0) {
      ratio = 0;
    }
  } else if (historicalCount === 0) {
    if (recentCount > 2) {
      alertLevel = AlertLevels.Investigate;
    } else {
      alertLevel = AlertLevels.NoAlert;
    }
  } else {
    // At this stage we know both counts are non-zero
    const historicalAverage = historicalCount / previousYears;
    ratio = recentCount / historicalAverage;
    // Counts are positive definite, and lowest ratio is 0.0, so this will find a match
    alertLevel = OrderedAlertLevels.slice().reverse().find(
      level => (ratio! > AlertThresholds[level]),
    )!;
  }
  return {
    alertLevelOrder: OrderedAlertLevels.indexOf(alertLevel),
    alertLevel,
    ratio,
    categoryField: alertField,
    categoryValue: alertFieldValue,
    recentCount,
  } as ThresholdAlert;
};

// Descending severity, then alphabetical by category, then by descending recent count
// We expect all categoryFields to be identical in a particular list, so do not sort on this
export const sortAlerts = (a: ThresholdAlert, b: ThresholdAlert) => {
  if (a.alertLevelOrder !== b.alertLevelOrder) { return b.alertLevelOrder - a.alertLevelOrder; }
  if (b.categoryValue !== a.categoryValue) return a.categoryValue.localeCompare(b.categoryValue);
  if (a.recentCount !== b.recentCount) return b.recentCount - a.recentCount;
  // For now no sort on ratio
  return 0;
};

export const calculateAlertList = (
  alertField: string,
  alertEndDate: Date,
  timeWindowWeeks: number,
  previousYears: number,
  data: Sample[],
): { alerts: ThresholdAlert[], errorMessage: string | null } => {
  // We assume that required fields exist in data; should be checked by widget
  
  // Filter to useable data and check that there is any
  const requiredFields = [ThresholdAlertFields.Date, ThresholdAlertFields.Identifier, alertField];
  const filteredData = data.filter(
    row => requiredFields.every(field => !isNullOrEmpty(row[field])),
  );
  if (filteredData.length === 0) {
    return {
      alerts: [],
      errorMessage: 'No records in project, or no records with required fields; cannot calculate alerts',
    };
  }

  // Throw an error if there is no data from _before_ the earliest required date; we assume this 
  // means that data may be missing from the initial time window
  const earliestDate = new Date(
    Math.min(...filteredData.map(row => new Date(row[ThresholdAlertFields.Date]).getTime())),
  );
  const earliestRequiredDate = new Date(alertEndDate);
  earliestRequiredDate.setFullYear(earliestRequiredDate.getFullYear() - previousYears);
  earliestRequiredDate.setDate(earliestRequiredDate.getDate() - 7 * timeWindowWeeks);
  if (earliestDate > earliestRequiredDate) {
    return {
      alerts: [],
      errorMessage: 'Notification dates for records in the project do not extend back sufficiently far to calculate alerts',
    };
  }

  // Group rows by value of alertField, for efficiency
  const alertValues = Array.from(new Set(filteredData.map(row => row[alertField])));
  const alertValueDatasets: Record<string, Sample[]> = {};
  alertValues.forEach(value => {
    alertValueDatasets[value] = [];
  });
  filteredData.forEach(row => {
    alertValueDatasets[row[alertField]].push(row);
  });

  // Calculate alerts from relevant rows
  const alerts: ThresholdAlert[] = [];
  alertValues.forEach(value => {
    alerts.push(
      calculateAlert(
        alertField,
        value,
        alertEndDate,
        timeWindowWeeks,
        previousYears,
        alertValueDatasets[value],
      ),
    );
  });

  alerts.sort((a, b) => sortAlerts(a, b));

  return {
    alerts,
    errorMessage: null,
  };
};
