module.exports = {
    "roots": [
        "<rootDir>/src"
    ],
    "testMatch": [
        "**/__tests__/**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    preset: '@shelf/jest-mongodb',
    watchPathIgnorePatterns: ['globalConfig'],
    setupFilesAfterEnv: ['./jest.setup.redis-mock.js'],
};