import { fieldRenderFunctions, typeRenderFunctions } from './renderUtils';

const CHUNK_SIZE = 800;

type ColumnMeta = {
  key: string;
  isField: boolean;
  type: string;
};

const buildColumnMeta = (data: any[], headers: string[]): ColumnMeta[] =>
  headers.map((key) => {
    if (key in fieldRenderFunctions) return { key, isField: true, type: '' };
    const sample = data.find((row) => row[key] != null)?.[key];
    const type = sample instanceof Date ? 'date' : typeof sample;
    return { key, isField: false, type };
  });

const formatValueFromMeta = (key: string, value: any, type: string, isField: boolean): any => {
  if (isField) return fieldRenderFunctions[key](value);
  if (value == null) return '';
  if (type in typeRenderFunctions) return typeRenderFunctions[type](value);
  if (typeof value === 'string') return value.replace(/"/g, '""');
  return value;
};

export const formatCSVValues = (row: any, columnMeta?: ColumnMeta[]): any => {
  const formattedRow: any = {};
  for (const [key, value] of Object.entries(row)) {
    const meta = columnMeta?.find((m) => m.key === key);
    if (meta) {
      formattedRow[key] = formatValueFromMeta(key, value, meta.type, meta.isField);
    } else {
      const type = value instanceof Date ? 'date' : (typeof value).toLowerCase();
      const isField = key in fieldRenderFunctions;
      formattedRow[key] = formatValueFromMeta(key, value, type, isField);
    }
  }
  return formattedRow;
};

export const formatCsvBody = (
  data: any[],
  headerString: string[],
  columnMeta?: ColumnMeta[],
): string[] => {
  const meta = columnMeta ?? buildColumnMeta(data, headerString);
  const buffer = new Array(headerString.length);
  const lines = new Array(data.length);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (let j = 0; j < meta.length; j++) {
      const { key, isField, type } = meta[j];
      const value = row[key];
      if (value === undefined) throw new Error(`Could not find value for header ${key}`);
      buffer[j] = `"${formatValueFromMeta(key, value, type, isField)}"`;
    }
    lines[i] = buffer.join(',');
  }
  return lines;
};

export const estimateCSVSize = (data: any[], headers?: string[]): number => {
  if (data.length === 0) return 0;

  const resolvedHeaders: string[] = headers ?? Object.keys(formatCSVValues(data[0]));
  const meta = buildColumnMeta(data, resolvedHeaders);

  const sampleSize = Math.min(20, data.length);
  const encoder = new TextEncoder();
  let sampleBytes = 0;

  for (let i = 0; i < sampleSize; i++) {
    const row = data[i];

    const line = meta
      .map(({ key, isField, type }) => {
        const val = row[key];
        const formatted = formatValueFromMeta(key, val, type, isField);
        return `"${formatted ?? ''}"`;
      })
      .join(',');

    sampleBytes += encoder.encode(`${line}\n`).byteLength;
  }

  const avgRowBytes = sampleBytes / sampleSize;
  const headerLine = resolvedHeaders.join(',');
  const headerBytes = encoder.encode(`${headerLine}\n`).byteLength;

  return Math.ceil(headerBytes + avgRowBytes * data.length);
};

const yieldToMain =
  'scheduler' in globalThis && typeof (globalThis as any).scheduler.yield === 'function'
    ? () => (globalThis as any).scheduler.yield()
    : () => new Promise<void>((r) => setTimeout(r, 0));

export const generateCSVStream = (data: any[], headers?: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  if (data.length === 0 && !headers) throw new Error('Cannot generate CSV: no headers resolved');

  const resolvedHeaders: string[] = headers ?? Object.keys(formatCSVValues(data[0]));
  const columnMeta = buildColumnMeta(data, resolvedHeaders);

  let index = 0;
  let headerWritten = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!headerWritten) {
        controller.enqueue(encoder.encode(`${resolvedHeaders.join(',')}\n`));
        headerWritten = true;
      }
      if (index >= data.length) {
        controller.close();
        return;
      }
      const end = Math.min(index + CHUNK_SIZE, data.length);
      try {
        const lines = formatCsvBody(data.slice(index, end), resolvedHeaders, columnMeta);
        controller.enqueue(encoder.encode(`${lines.join('\n')}\n`));
      } catch (error) {
        controller.error(error);
        return;
      }
      index = end;
      await yieldToMain();
    },
  });
};
