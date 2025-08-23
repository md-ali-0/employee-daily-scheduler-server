import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: "tsconfig.test.json"
    }]
  },
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@jobs/(.*)$": "<rootDir>/src/jobs/$1",
    "^@generated/(.*)$": "<rootDir>/generated/$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/app.ts",
    "!src/routes/index.ts",
    "!src/config/db.ts",
    "!src/config/redis.ts",
    "!src/config/sentry.ts",
    "!src/config/swagger.ts",
    "!src/config/winston.ts",
    "!src/config/env.ts",
    "!src/config/i18n.ts",
    "!src/utils/storage/*", // Exclude storage implementations from coverage
    "!src/types/**/*.ts",
    "!src/core/error.classes.ts",
    "!src/core/response.util.ts",
    "!src/core/base.controller.ts",
    "!src/core/base.repository.ts",
    "!src/core/base.service.ts",
    "!src/middlewares/error.handler.ts",
    "!src/middlewares/multer.middleware.ts",
    "!src/middlewares/api-key.middleware.ts",
    "!src/middlewares/cache.middleware.ts",
    "!src/middlewares/cors.middleware.ts",
    "!src/middlewares/csrf.middleware.ts",
    "!src/middlewares/feature-flag.middleware.ts",
    "!src/middlewares/helmet.middleware.ts",
    "!src/middlewares/i18n.middleware.ts",
    "!src/middlewares/metrics.middleware.ts",
    "!src/middlewares/rate-limit.middleware.ts",
    "!src/middlewares/request-id.middleware.ts",
    "!src/middlewares/request-logger.middleware.ts",
    "!src/middlewares/sanitize.middleware.ts",
    "!src/middlewares/validation.middleware.ts",
    "!src/modules/file/**/*.ts", // Exclude file module for now
    "!src/modules/auth/auth.routes.ts", // Routes are typically covered by integration tests
    "!src/modules/user/user.routes.ts",
    "!src/modules/post/post.routes.ts",
    "!src/modules/category/**/*.ts", // Exclude new modules from unit test coverage for now
    "!src/modules/tag/**/*.ts",
    "!src/modules/series/**/*.ts",
    "!src/modules/comment/**/*.ts",
    "!src/modules/like/**/*.ts",
    "!src/modules/bookmark/**/*.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
}

export default config
