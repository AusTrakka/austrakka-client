import { AlertLevels } from '../../../src/constants/thresholdAlertConstants';
import { calculateAlert } from '../../../src/utilities/thresholdAlertUtils';
import { Sample } from '../../../src/types/sample.interface';

describe('calculateAlert', () => {
  test('Given only historical records, expect no alert', () => {
    // Arrange - 0 recent, 3 historical
    const data = [
      { 'PHESS_ID': '1', 'cgMLST': '11', 'Date_notification': new Date(2020, 0, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2020, 0, 20) },
      { 'PHESS_ID': '3', 'cgMLST': '11', 'Date_notification': new Date(2020, 0, 15) },
    ];

    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);

    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(0.0, 2);
    expect(alert.alertLevel).toBe(AlertLevels.NoAlert);
    expect(alert.recentCount).toBe(0);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  test('Given investigate ratio, expect investigate alert', () => {
    // Arrange - 6 recent, 1*5 historical
    const data = [
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2020, 1, 1) },
      { 'PHESS_ID': '11', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '12', 'cgMLST': '11', 'Date_notification': new Date(2018, 1, 1) },
      { 'PHESS_ID': '13', 'cgMLST': '11', 'Date_notification': new Date(2017, 1, 1) },
      { 'PHESS_ID': '14', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 20) },
      { 'PHESS_ID': '4', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 15) },
      { 'PHESS_ID': '5', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '6', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '7', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '8', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
    ];

    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);

    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(6.0, 2);
    expect(alert.alertLevel).toBe(AlertLevels.Investigate);
    expect(alert.recentCount).toBe(6);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  test('Given review ratio, expect review alert', () => {
    // Arrange - 4 recent, 1*5 historical
    const data = [
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2020, 1, 1) },
      { 'PHESS_ID': '11', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '12', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '13', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '14', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 20) },
      { 'PHESS_ID': '4', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 15) },
      { 'PHESS_ID': '5', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '6', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
    ];

    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);
    
    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(4.0, 2);
    expect(alert.alertLevel).toBe(AlertLevels.Review);
    expect(alert.recentCount).toBe(4);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  test('Given monitor ratio, expect monitor alert', () => {
    // Arrange - 5 recent, 2*5 historical
    const data = [
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2020, 1, 1) },
      { 'PHESS_ID': '11', 'cgMLST': '11', 'Date_notification': new Date(2019, 0, 20) },
      { 'PHESS_ID': '12', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '13', 'cgMLST': '11', 'Date_notification': new Date(2018, 1, 1) },
      { 'PHESS_ID': '14', 'cgMLST': '11', 'Date_notification': new Date(2018, 0, 21) },
      { 'PHESS_ID': '15', 'cgMLST': '11', 'Date_notification': new Date(2018, 1, 5) },
      { 'PHESS_ID': '16', 'cgMLST': '11', 'Date_notification': new Date(2017, 1, 1) },
      { 'PHESS_ID': '17', 'cgMLST': '11', 'Date_notification': new Date(2017, 0, 25) },
      { 'PHESS_ID': '18', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '19', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 9) },
      { 'PHESS_ID': '4', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 15) },
      { 'PHESS_ID': '5', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '6', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '7', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '8', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
    ];
    
    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);
    
    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(2.5, 2);
    expect(alert.alertLevel).toBe(AlertLevels.Monitor);
    expect(alert.recentCount).toBe(5);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  test('Given records outside time windows, expect alert ignores records', () => {
    // Arrange - 6 recent, 1*5 historical, 2 outside time window (samples 20 and 21)
    const data = [
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2020, 1, 1) },
      { 'PHESS_ID': '11', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '12', 'cgMLST': '11', 'Date_notification': new Date(2018, 1, 1) },
      { 'PHESS_ID': '13', 'cgMLST': '11', 'Date_notification': new Date(2017, 1, 1) },
      { 'PHESS_ID': '14', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 20) },
      { 'PHESS_ID': '4', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 15) },
      { 'PHESS_ID': '5', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '6', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '7', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '8', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '20', 'cgMLST': '11', 'Date_notification': new Date(2018, 11, 20) },
      { 'PHESS_ID': '21', 'cgMLST': '11', 'Date_notification': new Date(2020, 11, 20) },
    ];
    
    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);
    
    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(6.0, 2);
    expect(alert.alertLevel).toBe(AlertLevels.Investigate);
    expect(alert.recentCount).toBe(6);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  test('Given multiple records for identifier, expect alert ignores later records', () => {
    // Arrange - 4 recent (+1 dupe), 1*5 historical (+3 dupes including 1 recent)
    const data = [
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 1) },
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 10) },
      { 'PHESS_ID': '10', 'cgMLST': '11', 'Date_notification': new Date(2018, 1, 1) },
      { 'PHESS_ID': '11', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '12', 'cgMLST': '11', 'Date_notification': new Date(2019, 1, 1) },
      { 'PHESS_ID': '13', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '14', 'cgMLST': '11', 'Date_notification': new Date(2016, 1, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 20) },
      { 'PHESS_ID': '4', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 15) },
      { 'PHESS_ID': '5', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      { 'PHESS_ID': '6', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 10) },
      { 'PHESS_ID': '6', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
    ];

    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);
    
    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(4.0, 2);
    expect(alert.alertLevel).toBe(AlertLevels.Review);
    expect(alert.recentCount).toBe(4);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  test('Given initial notification outside time window, expect records ignored', () => {
    // Similar to GivenMultipleRecordsForIdentifier_ExpectAlertIgnoresLaterRecords,
    // but here we are asserting that the first of the multiple records is outside the
    // time window of interest and therefore will ALSO be ignored

    // Arrange - 2 recent but both dupes of older records, i.e. 0 recent, 1 historical
    const data = [
      { 'PHESS_ID': '1', 'cgMLST': '11', 'Date_notification': new Date(2020, 1, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2019, 11, 1) },
      { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 0, 20) },
      { 'PHESS_ID': '3', 'cgMLST': '11', 'Date_notification': new Date(2020, 11, 15) },
      { 'PHESS_ID': '3', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
    ];

    const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);
    
    expect(alert.ratio).not.toBeNull();
    expect(alert.ratio).toBeCloseTo(0.0, 2);
    expect(alert.alertLevel).toBe(AlertLevels.NoAlert);
    expect(alert.recentCount).toBe(0);
    expect(alert.categoryField).toBe('cgMLST');
    expect(alert.categoryValue).toBe('11');
  });
  
  describe('Given no historical cases', () => {
    test('Given no recent cases, expect no alert', () => {
      // Arrange - 0 recent, 0 historical
      const data : Sample[] = [];

      const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);

      expect(alert.ratio).toBeNull();
      expect(alert.alertLevel).toBe(AlertLevels.NoAlert);
      expect(alert.recentCount).toBe(0);
      expect(alert.categoryField).toBe('cgMLST');
      expect(alert.categoryValue).toBe('11');
    });
    
    // if <=2 recent cases, and no historrical, rule is no alert
    test('Given 2 recent cases, expect no alert', () => {
      // Arrange - 2 recent, 0 historical
      const data : Sample[] = [
        { 'PHESS_ID': '1', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
        { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      ];

      const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);

      expect(alert.ratio).toBeNull();
      expect(alert.alertLevel).toBe(AlertLevels.NoAlert);
      expect(alert.recentCount).toBe(2);
      expect(alert.categoryField).toBe('cgMLST');
      expect(alert.categoryValue).toBe('11');
    });
    
    test('Given 3 recent cases, expect investigate alert', () => {
      // Arrange - 3 recent, 0 historical
      const data : Sample[] = [
        { 'PHESS_ID': '1', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
        { 'PHESS_ID': '2', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
        { 'PHESS_ID': '3', 'cgMLST': '11', 'Date_notification': new Date(2021, 1, 15) },
      ];

      const alert = calculateAlert('cgMLST', '11', new Date(2021, 1, 20), 6, 5, data);

      expect(alert.ratio).toBeNull();
      expect(alert.alertLevel).toBe(AlertLevels.Investigate);
      expect(alert.recentCount).toBe(3);
      expect(alert.categoryField).toBe('cgMLST');
      expect(alert.categoryValue).toBe('11');
    });
  });
});
