import { useEffect, useRef } from 'react';
import { dateTimeExprToExpr } from 'vega-lite/build/src/datetime';
import { CONTINUOUS_DOMAIN_SCALES } from 'vega-lite/build/src/scale';

export default function isoDateLocalDate(datetime: any) {
  console.log(datetime)
  var isoDate = null;
  typeof datetime.getValue === 'function' ? isoDate = new Date(datetime.getValue()) :  isoDate = new Date(Date.parse(datetime));
  console.log(datetime.getValue === 'function');
  const localDate = isoDate.toLocaleString("sv-SE", {year : 'numeric', month : 'numeric', day :'numeric', hour: 'numeric', minute: 'numeric'});
  return localDate;
}
export function isoDateLocalDateNoTime(datetime: any) {
  const isoDate = new Date(datetime.getValue());
  const localDate = isoDate.toLocaleString("sv-SE", {year : 'numeric', month : 'numeric', day :'numeric'});
  return localDate;
}

export function formatDate(dateUTC: any)
{
  var date = new Date(dateUTC);
  return new Intl.DateTimeFormat('en-US', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: "shortGeneric" }).format(date).toString()
}

export function useFirstRender() {
  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return firstRender.current;
}

// Function to aggregate counts of objects in an array, on a certain property
export function aggregateArrayObjects(property: string, array: Array<any>) {
  const initialArray = array;
  const aggregatedCounts = [];
  const map = new Map();
  if (initialArray !== undefined) {
    for (let i = 0; i < initialArray.length; i += 1) {
      let found = false;
      for (const [key, value] of map) {
        if (key === initialArray[i][property]) {
          found = true;
          const newValue = value + 1;
          map.set(initialArray[i][property], newValue);
          break;
        }
      }
      if (!found) { map.set(initialArray[i][property], 1); }
    }

    for (const [key, value] of map) {
      const obj = { [property]: '', sampleCount: 0 };
      obj[property] = key;
      obj.sampleCount = value;
      aggregatedCounts.push(obj);
    }
  }
  return aggregatedCounts;
}

// Generic function to create filter string in SSKV format from date filter object
export function generateDateFilterString(
  dateObject: { field: string, condition: string, fieldType: string, value: any },
) {
  let filterString = '';
  if (Object.keys(dateObject).length !== 0) {
    const date = `${dateObject.value.$d.toISOString()}`;
    filterString = `SSKV${dateObject.condition}=${dateObject.field}|${date},`;
    console.log(dateObject.value.$d.toISOString());
    console.log(date);
  }
  return filterString;
}
