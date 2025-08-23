import env from "@config/env"
import logger from "@config/winston"
import { Queue, QueueEvents } from "bullmq"

export const connection = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  username: env.REDIS_USER || 'default',
  password: env.REDIS_PASSWORD,
}

export const emailQueue = new Queue("emailQueue", { connection })
export const imageProcessingQueue = new Queue("imageProcessingQueue", { connection })
export const postPublishingQueue = new Queue("postPublishingQueue", { connection }) // New queue for post publishing

// Use QueueEvents for job lifecycle events
const emailQueueEvents = new QueueEvents("emailQueue", { connection })
const imageProcessingQueueEvents = new QueueEvents("imageProcessingQueue", { connection })
const postPublishingQueueEvents = new QueueEvents("postPublishingQueue", { connection })

emailQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Job ${jobId} completed for queue emailQueue`)
})
	emailQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed for queue emailQueue with error: ${failedReason}`)
})

imageProcessingQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Job ${jobId} completed for queue imageProcessingQueue`)
})
imageProcessingQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed for queue imageProcessingQueue with error: ${failedReason}`)
})

postPublishingQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Job ${jobId} completed for queue postPublishingQueue`)
})
postPublishingQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed for queue postPublishingQueue with error: ${failedReason}`)
})

emailQueueEvents.on("error", (err) => {
  logger.error("Email QueueEvents error:", err)
})
imageProcessingQueueEvents.on("error", (err) => {
  logger.error("Image Processing QueueEvents error:", err)
})
postPublishingQueueEvents.on("error", (err) => {
  logger.error("Post Publishing QueueEvents error:", err)
})

logger.info("BullMQ queues initialized.")

// Helper functions for adding email jobs
export const addEmailJob = async (emailData: any) => {
  return emailQueue.add("sendEmail", emailData, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}

export const addWelcomeEmailJob = async (userEmail: string, userName: string, userRole: string) => {
  return emailQueue.add("sendWelcomeEmail", {
    type: 'welcome',
    to: userEmail,
    userName,
    userRole
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}

export const addLoginNotificationJob = async (userEmail: string, userName: string, loginData: any) => {
  return emailQueue.add("sendLoginNotification", {
    type: 'login-notification',
    to: userEmail,
    userName,
    loginData
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}

export const addPostApprovedEmailJob = async (userEmail: string, authorName: string, postData: any) => {
  return emailQueue.add("sendPostApprovedEmail", {
    type: 'post-approved',
    to: userEmail,
    authorName,
    postData
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}

export const addPostRejectedEmailJob = async (userEmail: string, authorName: string, postData: any, feedback: string) => {
  return emailQueue.add("sendPostRejectedEmail", {
    type: 'post-rejected',
    to: userEmail,
    authorName,
    postData,
    feedback
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}

export const addPasswordResetEmailJob = async (userEmail: string, userName: string, resetToken: string) => {
  return emailQueue.add("sendPasswordResetEmail", {
    type: 'password-reset',
    to: userEmail,
    userName,
    resetToken
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}

export const addCommentNotificationJob = async (userEmail: string, authorName: string, commentData: any) => {
  return emailQueue.add("sendCommentNotification", {
    type: 'comment-notification',
    to: userEmail,
    authorName,
    commentData
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  })
}
