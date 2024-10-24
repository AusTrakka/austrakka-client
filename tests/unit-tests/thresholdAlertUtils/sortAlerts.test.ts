import { sortAlerts, ThresholdAlert } from '../../../src/utilities/thresholdAlertUtils';
import { AlertLevels } from '../../../src/constants/thresholdAlertConstants';

describe('sortAlerts', () => {
  test('should sort alerts by descending alertLevelOrder', () => {
    const alert1: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue1',
      recentCount: 1,
    };
    const alert2: ThresholdAlert = {
      alertLevelOrder: 2,
      alertLevel: AlertLevels.Review,
      ratio: 3.0,
      categoryField: 'categoryField2',
      categoryValue: 'categoryValue2',
      recentCount: 2,
    };
    const alert3: ThresholdAlert = {
      alertLevelOrder: 3,
      alertLevel: AlertLevels.Investigate,
      ratio: 5.0,
      categoryField: 'categoryField3',
      categoryValue: 'categoryValue3',
      recentCount: 3,
    };
    const alerts = [alert2, alert3, alert1];
    alerts.sort(sortAlerts);
    expect(alerts).toEqual([alert3, alert2, alert1]);
  });
  
  test('should sort alerts by ascending categoryValue', () => {
    const alert1: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue1',
      recentCount: 1,
    };
    const alert2: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue2',
      recentCount: 2,
    };
    const alert3: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue3',
      recentCount: 3,
    };
    const alerts = [alert2, alert3, alert1];
    alerts.sort(sortAlerts);
    expect(alerts).toEqual([alert1, alert2, alert3]);
  });
  
  test('should sort alerts by descending recentCount', () => {
    const alert1: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue1',
      recentCount: 1,
    };
    const alert2: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue1',
      recentCount: 2,
    };
    const alert3: ThresholdAlert = {
      alertLevelOrder: 1,
      alertLevel: AlertLevels.Monitor,
      ratio: 1.5,
      categoryField: 'categoryField1',
      categoryValue: 'categoryValue1',
      recentCount: 3,
    };
    const alerts = [alert2, alert3, alert1];
    alerts.sort(sortAlerts);
    expect(alerts).toEqual([alert3, alert2, alert1]);
  });
});
