module.exports = {
  // test/e2e/ needs a real, already-running MariaDB instance (see
  // docs/specification-roadmap.md) and is opt-in via `npm run test:e2e`,
  // not part of the default suite CI gates on.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/e2e/'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
