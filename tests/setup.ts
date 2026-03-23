import { TextDecoder, TextEncoder } from 'node:util';
import { ReadableStream } from 'web-streams-polyfill';

Object.assign(global, { TextEncoder, TextDecoder, ReadableStream });
