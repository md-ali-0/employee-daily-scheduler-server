import logger from "@config/winston";
import emailService from "@services/email.service";
import { Worker } from "bullmq";
import { connection, emailQueue, imageProcessingQueue } from "./queue"; // Import new queue

// Define job types
export enum JobType {
  SEND_EMAIL = "sendEmail",
  PROCESS_IMAGE = "processImage",
  PUBLISH_POST = "publishPost", // New job type
  // Add more job types here
}

// Worker for sending emails
export const emailWorker = new Worker(
  emailQueue.name,
  async (job) => {
    logger.info(`Processing email job ${job.id}: ${job.data.to}`)
    
    try {
      const { type, ...emailData } = job.data
      
      let success = false
      
      switch (type) {
        case 'welcome':
          success = await emailService.sendWelcomeEmail(
            emailData.to, 
            emailData.userName, 
            emailData.userRole
          )
          break
        case 'login-notification':
          success = await emailService.sendLoginNotification(
            emailData.to, 
            emailData.userName, 
            emailData.loginData
          )
          break
        case 'post-approved':
          success = await emailService.sendPostApprovedEmail(
            emailData.to, 
            emailData.authorName, 
            emailData.postData
          )
          break
        case 'post-rejected':
          success = await emailService.sendPostRejectedEmail(
            emailData.to, 
            emailData.authorName, 
            emailData.postData, 
            emailData.feedback
          )
          break
        case 'password-reset':
          success = await emailService.sendPasswordResetEmail(
            emailData.to, 
            emailData.userName, 
            emailData.resetToken
          )
          break
        case 'comment-notification':
          success = await emailService.sendCommentNotification(
            emailData.to, 
            emailData.authorName, 
            emailData.commentData
          )
          break
        default:
          // Generic email sending
          success = await emailService.sendEmail(emailData)
      }
      
      if (success) {
        logger.info(`Email sent successfully to ${emailData.to}`)
      } else {
        logger.error(`Failed to send email to ${emailData.to}`)
        throw new Error('Email sending failed')
      }
    } catch (error) {
      logger.error(`Error processing email job ${job.id}:`, error)
      throw error
    }
  },
  { connection },
)

// Worker for image processing
export const imageProcessingWorker = new Worker(
  imageProcessingQueue.name,
  async (job) => {
    logger.info(`Processing image job ${job.id}: ${job.data.imageUrl}`)
    // Simulate image processing (e.g., resizing, watermarking)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    logger.info(`Image processed for ${job.data.imageUrl}`)
  },
  { connection },
)

// Add more workers for different job types

emailWorker.on("completed", (job) => {
  logger.info(`Email job ${job.id} completed.`)
})

emailWorker.on("failed", (job, err) => {
  logger.error(`Email job ${job?.id} failed with error: ${err.message}`)
})

imageProcessingWorker.on("completed", (job) => {
  logger.info(`Image processing job ${job.id} completed.`)
})

imageProcessingWorker.on("failed", (job, err) => {
  logger.error(`Image processing job ${job?.id} failed with error: ${err.message}`)
})

logger.info("BullMQ workers initialized.")
