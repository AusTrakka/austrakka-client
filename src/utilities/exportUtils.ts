import { fieldRenderFunctions, typeRenderFunctions } from './renderUtils';

const CHUNK_SIZE = 500;

export const estimateCSVSize = (data: any[], headers?: string[]): number => {
  if (data.length === 0) return 0;

  const resolvedHeaders: string[] = headers ?? Object.keys(formatCSVValues(data[0]));

  // Sample up to 20 rows to get an average row byte size
  const sampleSize = Math.min(20, data.length);
  const encoder = new TextEncoder();
  let sampleBytes = 0;

  for (let i = 0; i < sampleSize; i++) {
    const formatted = formatCSVValues(data[i]);
    const line = resolvedHeaders.map((h) => `"${String(formatted[h] ?? '')}"`).join(',');
    sampleBytes += encoder.encode(`${line}\n`).byteLength;
  }

  const avgRowBytes = sampleBytes / sampleSize;
  const headerBytes = encoder.encode(
    `${resolvedHeaders.map((h) => `"${h}"`).join(',')}\n`,
  ).byteLength;

  console.log('I found out the size');
  return Math.ceil(headerBytes + avgRowBytes * data.length);
};

const formatCsvBody = (data: any[], headerString: string[]): any[] => {
  const csvRows = [];

  for (const row of data) {
    const values = headerString.map((header) => {
      const value = row[header];
      if (value === undefined) {
        throw new Error(`Could not find value for header ${header}`);
      }
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows;
};

export const formatDataAsCSV = (data: any[], headerString: string[]) => {
  const csvRows = [];
  csvRows.push(headerString.join(','));
  const csvContent = formatCsvBody(data, headerString);
  csvRows.push(...csvContent);
  return csvRows.join('\n');
};

export const formatCSVValues = (row: any) => {
  const formattedRow: any = {};
  for (const [key, value] of Object.entries(row)) {
    const type = value instanceof Date ? 'date' : (typeof value).toLocaleLowerCase();
    switch (true) {
      case key in fieldRenderFunctions:
        formattedRow[key] = fieldRenderFunctions[key](value);
        break;
      case type in typeRenderFunctions:
        // this handles null values
        formattedRow[key] = typeRenderFunctions[type](value);
        break;
      case type === 'object' && value === null:
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

export const generateCSV = (data: any[], headers?: string[]) => {
  // Processing data here
  const formattedData = data.map((row: any) => formatCSVValues(row));
  // Set headers
  const header = headers === undefined ? Object.keys(formattedData[0]) : headers;

  // Set data for CSVLink
  return formatDataAsCSV(formattedData, header);
};

export const generateCSVStream = (data: any[], headers?: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  console.log('am i generating a csv here');
  const resolvedHeaders: string[] =
    headers ?? (data.length > 0 ? Object.keys(formatCSVValues(data[0])) : []);

  if (resolvedHeaders.length === 0) throw new Error('Cannot generate CSV: no headers resolved');

  let index = 0;
  let headerWritten = false;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      // Write header once
      if (!headerWritten) {
        controller.enqueue(encoder.encode(`${resolvedHeaders.map((h) => `"${h}"`).join(',')}\n`));
        headerWritten = true;
      }

      if (index >= data.length) {
        controller.close();
        return;
      }

      // Build a single large string per chunk rather than enqueuing per-row
      const end = Math.min(index + CHUNK_SIZE, data.length);
      const lines: string[] = [];

      for (let i = index; i < end; i++) {
        const formatted = formatCSVValues(data[i]);
        lines.push(resolvedHeaders.map((h) => `"${String(formatted[h] ?? '')}"`).join(','));
      }

      controller.enqueue(encoder.encode(`${lines.join('\n')}\n`));
      index = end;

      const yieldToMain = (() => {
        if (
          'scheduler' in globalThis &&
          typeof (globalThis as any).scheduler.yield === 'function'
        ) {
          console.log('[CSV Export] Using scheduler.yield() for main thread yielding');
          return () => (globalThis as any).scheduler.yield();
        }
        console.log('[CSV Export] scheduler.yield() unavailable, falling back to setTimeout(0)');
        return () => new Promise<void>((r) => setTimeout(r, 0));
      })();
    },
  });
};
