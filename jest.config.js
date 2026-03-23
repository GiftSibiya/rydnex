module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
  },
};
