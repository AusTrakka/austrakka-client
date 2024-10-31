import { Sample } from '../../../src/types/sample.interface';
import { calculateAlertList } from '../../../src/utilities/thresholdAlertUtils';

describe('calculateAlertList', () => {
  test('should return an empty array and an error message if there are no records in the project', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2021-02-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts).toEqual([]);
    expect(result.errorMessage).toEqual('No records in project, or no records with required fields; cannot calculate alerts');
  });
  
  test('should return an empty array and an error message if there are no records with Date_notification', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2021-02-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [
      { PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue' },
    ];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts).toEqual([]);
    expect(result.errorMessage).toEqual('No records in project, or no records with required fields; cannot calculate alerts');
  });
  
  test('should return an empty array and an error message if there are no records with PHESS_ID', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2021-02-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [
      { Date_notification: '2021-02-20', alertField: 'alertFieldValue' },
    ];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts).toEqual([]);
    expect(result.errorMessage).toEqual('No records in project, or no records with required fields; cannot calculate alerts');
  });
  
  test('should return an empty array and an error message if there are no records with alertField', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2021-02-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [
      { Date_notification: '2021-02-20', PHESS_ID: 'PHESS_ID' },
    ];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts).toEqual([]);
    expect(result.errorMessage).toEqual('No records in project, or no records with required fields; cannot calculate alerts');
  });
  
  test('should return an empty array and an error message if there is no data from before the earliest required date', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2020-04-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [
      { Date_notification: '2015-03-10', PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue' },
    ];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts).toEqual([]);
    expect(result.errorMessage).toEqual('Notification dates for records in the project do not extend back sufficiently far to calculate alerts');
  });

  test('should return alerts and no error if there is data from before the earliest required date', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2020-04-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [
      { Date_notification: '2015-01-10', PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue' },
    ];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts.length).toEqual(1);
    expect(result.errorMessage).toEqual(null);
  });
  
  test('should return one alert row per unique value of alertField', () => {
    const alertField = 'alertField';
    const alertEndDate = new Date('2020-04-20');
    const timeWindowWeeks = 6;
    const previousYears = 5;
    const data: Sample[] = [
      { Date_notification: '2015-01-10', PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue1' },
      { Date_notification: '2019-04-10', PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue2' },
      { Date_notification: '2019-04-10', PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue2' },
      { Date_notification: '2019-04-10', PHESS_ID: 'PHESS_ID', alertField: 'alertFieldValue3' },
    ];
    const result = calculateAlertList(
      alertField,
      alertEndDate,
      timeWindowWeeks,
      previousYears,
      data,
    );
    expect(result.alerts.length).toEqual(3);
    expect(result.errorMessage).toEqual(null);
  });
});
