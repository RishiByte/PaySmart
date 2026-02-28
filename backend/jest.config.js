module.exports = {
    testEnvironment: 'node',
    setupFilesAfterSetup: ['./__tests__/setup.js'],
    testTimeout: 30000,
    testPathIgnorePatterns: ['/node_modules/', '/__tests__/setup.js'],
};
