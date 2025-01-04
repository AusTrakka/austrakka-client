import {fieldRenderFunctions, typeRenderFunctions} from './renderUtils';
import FriendlyHeader from "../types/friendlyHeader.interface";

export const formatDataAsCSV2 = (data: any[], headers: FriendlyHeader[]) => {
  const csvHeader = headers.map(header => header.displayName).join(',');
  const dataHeaders = headers.map(header => header.name);
  const csvContent = formatDataAsCSV(data, dataHeaders, true);
  return `${csvHeader}\n${csvContent}`;
}

export const formatDataAsCSV = (
    data: any[], 
    headerString: string[],
    excludeHeader: boolean = false
) => {
  // Format data array as CSV string

  const csvRows = [];
  // if there are more headers than data,
  // it will throw an error when it tries to query the data below
  
  // if there are fewer headers than data,
  // that means it is selecting a subset of the data

  // Add headers
  if (!excludeHeader) {
    csvRows.push(headerString.join(','));
  }

  // Add data rows
  for (const row of data) {
    const values = headerString.map(header => {
      const value = row[header];
      if (value === undefined) {
        throw new Error(`Could not find value for header ${header}`);
      }
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

export const formatCSVValues = (row: any) => {
  const formattedRow: any = {};
  for (const [key, value] of Object.entries(row)) {
    const type = value instanceof Date ? 'date' : (typeof value).toLocaleLowerCase();
    switch (true) {
      case (key in fieldRenderFunctions):
        formattedRow[key] = fieldRenderFunctions[key](value);
        break;
      case (type in typeRenderFunctions):
        // this handles null values
        formattedRow[key] = typeRenderFunctions[type](value);
        break;
      case (type === 'object' && value === null):
        formattedRow[key] = '';
        break;
      case typeof value === 'string':
        formattedRow[key] = (value as string).replace(/"/g, '""');
        break;
      default:
        formattedRow[key] = value;
    }
  }
  return formattedRow;
};

export const generateCSV2 = (data: any[], headers: FriendlyHeader[]) => {
  const formattedData = data.map((row: any) => formatCSVValues(row));
  return formatDataAsCSV2(formattedData, headers);
}

export const generateCSV = (data: any[], headers?:string[]) => {
  // Processing data here
  const formattedData = data.map((row: any) => formatCSVValues(row));
  // Set headers
  const header = headers === undefined ?
    Object.keys(formattedData[0]) : headers;

  // Set data for CSVLink
  return formatDataAsCSV(formattedData, header);
};
