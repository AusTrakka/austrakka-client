/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'jsdom',
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  collectCoverage: true,
    setupFiles: ['./tests/setup.ts'],
  collectCoverageFrom: [
    "src/**/*Utils.ts"
  ]
};
