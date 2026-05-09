module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    env: { NODE_ENV: 'test' },
  },
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  globalSetup: undefined,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/config/**'],
  testTimeout: 15000,
};
