import { ReadableStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(global, { TextEncoder, TextDecoder, ReadableStream });
