export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  transform: {},

  // which test to run
  testMatch: ["<rootDir>/tests/**/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/*.js", "models/*.js", "routes/*.js", "helpers/*.js", "middlewares/*.js", "config/*.js"],
};
