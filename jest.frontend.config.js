export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  // For running all test files:
  testMatch: ["<rootDir>/client/src/**/*.test.js"],
  // For running unit tests only:
  // testMatch: [
  //   "<rootDir>/client/src/pages/admin/*.test.js",
  //   "<rootDir>/client/src/components/**/*.test.js",
  //   "<rootDir>/client/src/hooks/**/*.test.js",
  //   "<rootDir>/client/src/context/**/*.test.js",
  //   "!<rootDir>/client/src/pages/Auth/*.integration.test.js",
  //   "<rootDir>/client/src/pages/Auth/**/.(?!integration).test.js",
  //   "<rootDir>/client/src/pages/Auth/.(?!integration).test.js",
  // ],
  testPathIgnorePatterns: ["/_site/"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/components/**",
    "client/src/context/**",
    "client/src/hooks/**",
    "client/src/pages/**",
  ],
    
  coverageReporters: ["text", "lcov"],
};
