// Initialize Sentry before importing Express or any files that import Express
import { initSentryEarly } from "@config/sentry";
initSentryEarly()

import env from "@config/env";
import { closeSentry } from "@config/sentry";
import logger from "@config/winston";
import { emailWorker, imageProcessingWorker } from "@jobs/worker"; // Import named exports
import app from "./app";

const PORT = env.PORT || 3000

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`)
    logger.info(`API Docs available at http://localhost:${PORT}/api-docs`)
    logger.info(`Health check available at http://localhost:${PORT}/health`)
  })

  // Start the BullMQ workers
  emailWorker.on("ready", () => {
    logger.info("Email worker is ready and listening for jobs.")
  })
  emailWorker.on("closed", () => {
    logger.info("Email worker closed.")
  })

  imageProcessingWorker.on("ready", () => {
    logger.info("Image processing worker is ready and listening for jobs.")
  })
  imageProcessingWorker.on("closed", () => {
    logger.info("Image processing worker closed.")
  })
}

startServer()

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...")
  logger.error(err.name, err.message, err.stack)
  closeSentry().finally(() => {
    process.exit(1) // Exit with a failure code
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...")
  logger.error(err.name, err.message, err.stack)
  closeSentry().finally(() => {
    process.exit(1) // Exit with a failure code
  })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...")
  await Promise.all([
    emailWorker.close(),
    imageProcessingWorker.close(),
    closeSentry(),
  ])
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...")
  await Promise.all([
    emailWorker.close(),
    imageProcessingWorker.close(),
    closeSentry(),
  ])
  process.exit(0)
})
